#!/usr/bin/env python3
"""
Quorum — Scenario Controller v2 (The Organic Puppeteer)
Stochastic Bipartite Attack Generator with multiple spray patterns.

Attack Patterns:
  WIDE_STEALTH       — many IPs, few hits each (hardest to detect)
  NARROW_AGGRESSIVE  — few IPs, many hits each (louder but sub-threshold)
  STUTTER_BURST      — random burst/pause rhythm mimicking human operators
"""

import sys
import time
import json
import random
import argparse

if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import os

API_URL        = "http://localhost:3000/api/v1/live/ingest"
TRIGGER_URL    = "http://localhost:3000/api/v1/live/trigger"
RESET_URL      = "http://localhost:3000/api/v1/live/state"
SIMULATION_KEY = (
    os.environ.get("QUORUM_SECRET_KEY")
    or os.environ.get("SIMULATION_INGEST_KEY")
    or "quorum-secret-key-2026"
)

# ── IP / User pools — freshly randomised each session ────────────────────────
_RESIDENTIAL_SUBNETS = [
    "185.220.101", "194.26.29",  "198.98.56",   "45.154.255",
    "103.149.130", "193.148.18", "91.240.118",   "176.119.25",
    "45.139.122",  "77.247.108", "164.132.89",   "167.99.200",
    "89.234.157",  "162.247.74", "171.25.193",   "199.87.154",
]

_VPN_PROVIDERS = ["NordVPN", "ExpressVPN", "Mullvad", "Proton", "Surfshark"]

def _fresh_session_pools():
    """Randomise IP pool and user pool each session so no two demos look alike."""
    random.shuffle(_RESIDENTIAL_SUBNETS)
    subnets = _RESIDENTIAL_SUBNETS[:12]
    campaign_ips = [f"{s}.{random.randint(2,253)}" for s in subnets]

    # Corporate IPs (baseline)
    corp_ips = [
        f"10.{random.randint(0,3)}.{random.randint(1,10)}.{random.randint(2,250)}"
        for _ in range(20)
    ]

    # User pool — randomise ordering + add high-value targets
    base_users = [f"user_{i:04d}" for i in range(1, 101)]
    hvt = ["ciso_admin", "finance_lead", "corp_vp", "it_support",
           "service_account", "cloud_admin", "azure_sa", "backup_svc"]
    user_pool = base_users + hvt
    random.shuffle(user_pool)

    return campaign_ips, corp_ips, user_pool

SESSION_IPS: list[str] = []
SESSION_USERS: list[str] = []
SESSION_CORP_IPS: list[str] = []

CURRENT_CAMPAIGN_IPS: list[str] = []
CURRENT_TARGET_USERS: list[str] = []


# ── HTTP helpers ──────────────────────────────────────────────────────────────
def _headers():
    return {
        "Content-Type": "application/json",
        "x-quorum-secret-key": SIMULATION_KEY,
        "x-simulation-key":    SIMULATION_KEY,
    }

def post_event(ip: str, user: str, outcome: str = "FAILURE") -> bool:
    payload = {"ip": ip, "user": user, "outcome": outcome, "timestamp": time.time()}
    data    = json.dumps(payload).encode("utf-8")
    try:
        try:
            import requests
            resp = requests.post(API_URL, json=payload, headers=_headers(), timeout=2.0)
            return resp.status_code == 200
        except ImportError:
            import urllib.request
            req = urllib.request.Request(API_URL, data=data, headers=_headers(), method="POST")
            with urllib.request.urlopen(req, timeout=2.0) as r:
                return r.status == 200
    except Exception as e:
        print(f"  [!] Delivery failed: {e}")
        return False

def post_trigger(mode: str) -> bool:
    """Hit the /api/v1/live/trigger endpoint (no auth required — server-side seeding)."""
    payload = {"mode": mode}
    data    = json.dumps(payload).encode("utf-8")
    try:
        try:
            import requests
            resp = requests.post(TRIGGER_URL, json=payload,
                                 headers={"Content-Type": "application/json"}, timeout=4.0)
            body = resp.json()
            print(f"  > trigger/{mode}: {body.get('message', resp.status_code)}")
            return resp.ok
        except ImportError:
            import urllib.request
            req = urllib.request.Request(
                TRIGGER_URL, data=data,
                headers={"Content-Type": "application/json"}, method="POST"
            )
            with urllib.request.urlopen(req, timeout=4.0) as r:
                body = json.loads(r.read().decode("utf-8"))
                print(f"  > trigger/{mode}: {body.get('message', r.status)}")
                return r.status == 200
    except Exception as e:
        print(f"  [!] Trigger error: {e}")
        return False

def reset_state():
    print("\n[RESET] Resetting Quorum Live State...")
    try:
        import urllib.request
        req = urllib.request.Request(
            RESET_URL,
            data=json.dumps({"action": "reset"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=2.0):
            print("  OK Engine memory wiped. Ready for fresh scenario.")
    except Exception as e:
        print(f"  [!] Reset error: {e}")


# ── Stages ────────────────────────────────────────────────────────────────────
def run_baseline(count: int = 15):
    global SESSION_CORP_IPS, SESSION_USERS
    if not SESSION_CORP_IPS:
        SESSION_CORP_IPS = [
            f"10.{random.randint(0,3)}.{random.randint(1,10)}.{random.randint(2,250)}"
            for _ in range(20)
        ]
    print(f"\n[BASELINE] Injecting {count} benign enterprise authentications...")
    for i in range(count):
        ip      = random.choice(SESSION_CORP_IPS)
        user    = random.choice(SESSION_USERS or [f"user_{i:04d}"])
        outcome = "SUCCESS" if random.random() < 0.94 else "FAILURE"
        post_event(ip, user, outcome)
        sys.stdout.write(f"\r  [{i+1}/{count}] {outcome} | {user} @ {ip}   ")
        sys.stdout.flush()
        time.sleep(random.uniform(0.12, 0.40))
    print("\n  OK Baseline established. Naive SIEM rules: 0 alerts.")


# ── Spray patterns ───────────────────────────────────────────────────────────
def _spray_wide_stealth(ips, users):
    """Many IPs, 1-2 hits each — hardest to detect, slowest to build consensus."""
    print("  Pattern: WIDE_STEALTH (many proxies, very few hits each)")
    count = 0
    for ip in ips:
        targets = random.sample(users, min(random.randint(1, 2), len(users)))
        for user in targets:
            count += 1
            post_event(ip, user, "FAILURE")
            sys.stdout.write(f"\r  [{count}] {ip} -> {user}   ")
            sys.stdout.flush()
            time.sleep(random.uniform(0.22, 0.58))
    return count

def _spray_narrow_aggressive(ips, users):
    """Few IPs, 4-6 hits each — louder but still sub-threshold (< 5 per IP rule)."""
    print("  Pattern: NARROW_AGGRESSIVE (few proxies, more hits each)")
    active_ips = ips[:min(4, len(ips))]
    count = 0
    for ip in active_ips:
        targets = random.sample(users, min(random.randint(4, 6), len(users)))
        for user in targets:
            count += 1
            post_event(ip, user, "FAILURE")
            sys.stdout.write(f"\r  [{count}] {ip} -> {user}   ")
            sys.stdout.flush()
            time.sleep(random.uniform(0.08, 0.25))
    return count

def _spray_stutter_burst(ips, users):
    """Random burst/pause rhythm mimicking human operators across time zones."""
    print("  Pattern: STUTTER_BURST (burst/pause rhythm)")
    count = 0
    for ip in ips:
        burst_size = random.randint(1, 3)
        targets    = random.sample(users, min(burst_size, len(users)))
        for user in targets:
            count += 1
            post_event(ip, user, "FAILURE")
            sys.stdout.write(f"\r  [{count}] {ip} -> {user} [burst]   ")
            sys.stdout.flush()
            time.sleep(random.uniform(0.05, 0.18))
        # Pause between bursts
        pause = random.uniform(0.4, 1.2)
        time.sleep(pause)
    return count

SPRAY_PATTERNS = {
    "WIDE_STEALTH":       _spray_wide_stealth,
    "NARROW_AGGRESSIVE":  _spray_narrow_aggressive,
    "STUTTER_BURST":      _spray_stutter_burst,
}

def get_random_pattern():
    return random.choice(list(SPRAY_PATTERNS.keys()))

def run_spray(num_ips: int = 12, num_targets: int = 35, pattern: str | None = None):
    global CURRENT_CAMPAIGN_IPS, CURRENT_TARGET_USERS
    global SESSION_IPS, SESSION_USERS

    chosen_pattern = pattern or get_random_pattern()
    print(f"\n[SPRAY] Launching Low-and-Slow Bipartite Attack")
    print(f"  Proxies: {num_ips} | Targets: {num_targets} | Pattern: {chosen_pattern}")

    CURRENT_CAMPAIGN_IPS  = SESSION_IPS[:num_ips]
    CURRENT_TARGET_USERS  = SESSION_USERS[:num_targets]

    fn    = SPRAY_PATTERNS[chosen_pattern]
    count = fn(CURRENT_CAMPAIGN_IPS, CURRENT_TARGET_USERS)

    print(f"\n  OK {count} events dispatched. Naive rules blind (<5 fails/IP).")
    print(f"  OK Bipartite graph Union-Find should now detect cluster.")


def run_pivot():
    global CURRENT_CAMPAIGN_IPS, CURRENT_TARGET_USERS
    print("\n[PIVOT] Executing Post-Spray Compromise Pivot...")

    if not CURRENT_CAMPAIGN_IPS or not CURRENT_TARGET_USERS:
        # Try fetching cluster data from server
        try:
            import urllib.request
            req = urllib.request.Request(RESET_URL, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                data     = json.loads(resp.read().decode("utf-8"))
                clusters = data.get("clusters", [])
                if clusters:
                    CURRENT_CAMPAIGN_IPS  = clusters[0].get("contributingIps", [])
                    CURRENT_TARGET_USERS  = clusters[0].get("targetedAccounts", [])
        except Exception:
            pass

    if not CURRENT_CAMPAIGN_IPS or not CURRENT_TARGET_USERS:
        CURRENT_CAMPAIGN_IPS = [SESSION_IPS[0] if SESSION_IPS else "185.220.101.50"]
        CURRENT_TARGET_USERS = [SESSION_USERS[0] if SESSION_USERS else "user_0001"]
        post_event(CURRENT_CAMPAIGN_IPS[0], CURRENT_TARGET_USERS[0], "FAILURE")
        time.sleep(0.15)

    pivot_ip   = random.choice(CURRENT_CAMPAIGN_IPS)
    pivot_user = random.choice(CURRENT_TARGET_USERS)

    print(f"  COMPROMISED CREDENTIAL:")
    print(f"     Account : {pivot_user}")
    print(f"     Proxy IP: {pivot_ip}")
    print(f"     Outcome : SUCCESS (Valid Token Issued)")

    post_event(pivot_ip, pivot_user, "SUCCESS")
    print(f"\n  CRITICAL INCIDENT: Base 100 x 1.00 + 15 -> 100 [CRITICAL]")
    print(f"  Crimson Pulse and audio drone should fire in UI.")


# ── Full sequence ─────────────────────────────────────────────────────────────
def run_full_sequence(pattern: str | None = None):
    print("=" * 60)
    print("QUORUM LIVE DEMONSTRATION ORCHESTRATOR v2")
    print("=" * 60)
    reset_state()
    time.sleep(1.0)
    run_baseline(12)
    time.sleep(1.5)
    run_spray(num_ips=12, num_targets=35, pattern=pattern)
    time.sleep(2.5)
    run_pivot()
    print("\n" + "=" * 60)
    print("LIVE DEMO SEQUENCE COMPLETE")
    print("=" * 60)


# ── Interactive CLI ───────────────────────────────────────────────────────────
def interactive_cli():
    global SESSION_IPS, SESSION_USERS, SESSION_CORP_IPS
    SESSION_IPS, SESSION_CORP_IPS, SESSION_USERS = _fresh_session_pools()

    while True:
        print("\n" + "=" * 50)
        print(" QUORUM PUPPETEER v2 — LIVE CONTROLLER")
        print("=" * 50)
        print(" [1] Baseline Mode (Noise)")
        print(" [2] Spray Mode — WIDE_STEALTH")
        print(" [3] Spray Mode — NARROW_AGGRESSIVE")
        print(" [4] Spray Mode — STUTTER_BURST")
        print(" [5] Spray Mode — RANDOM PATTERN")
        print(" [6] Pivot Mode (Breach / Climax)")
        print(" [7] Full Automated Sequence (random pattern)")
        print(" [8] Reset Engine State")
        print(" [9] Trigger via API (BASELINE/SPRAY/PIVOT/RESET)")
        print(" [0] Exit")
        print("=" * 50)
        try:
            choice = input("Select > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if choice == "1":
            run_baseline()
        elif choice == "2":
            run_spray(pattern="WIDE_STEALTH")
        elif choice == "3":
            run_spray(pattern="NARROW_AGGRESSIVE")
        elif choice == "4":
            run_spray(pattern="STUTTER_BURST")
        elif choice == "5":
            run_spray(pattern=None)
        elif choice == "6":
            run_pivot()
        elif choice == "7":
            run_full_sequence(pattern=None)
        elif choice == "8":
            reset_state()
            SESSION_IPS, SESSION_CORP_IPS, SESSION_USERS = _fresh_session_pools()
        elif choice == "9":
            mode = input("  API Trigger mode (BASELINE/SPRAY/PIVOT/RESET): ").strip().upper()
            if mode in ("BASELINE", "SPRAY", "PIVOT", "RESET"):
                post_trigger(mode)
            else:
                print("  Invalid mode.")
        elif choice in ("0", "q", "exit"):
            break
        else:
            print("Invalid option.")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quorum Live Scenario Controller v2")
    parser.add_argument("--auto",    action="store_true",  help="Run full automated sequence")
    parser.add_argument("--stage",   choices=["baseline", "spray", "pivot", "reset", "trigger"],
                        help="Run a single stage")
    parser.add_argument("--pattern", choices=["WIDE_STEALTH", "NARROW_AGGRESSIVE", "STUTTER_BURST"],
                        help="Spray pattern (default: random)")
    parser.add_argument("--trigger-mode", choices=["BASELINE", "SPRAY", "PIVOT", "RESET"],
                        help="Mode for --stage trigger")
    args = parser.parse_args()

    # Initialise fresh pools
    SESSION_IPS, SESSION_CORP_IPS, SESSION_USERS = _fresh_session_pools()

    if args.auto:
        run_full_sequence(pattern=args.pattern)
    elif args.stage == "baseline":
        run_baseline()
    elif args.stage == "spray":
        run_spray(pattern=args.pattern)
    elif args.stage == "pivot":
        run_pivot()
    elif args.stage == "reset":
        reset_state()
    elif args.stage == "trigger":
        mode = args.trigger_mode or "RESET"
        post_trigger(mode)
    else:
        interactive_cli()
