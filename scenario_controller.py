#!/usr/bin/env python3
"""
Quorum — Scenario Controller (The Puppeteer)
Stochastic Bipartite Attack Generator for Live Demos.
"""

import sys
import time
import json
import random
import argparse

# Ensure UTF-8 output on Windows consoles
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

API_URL = "http://localhost:3000/api/v1/live/ingest"
RESET_URL = "http://localhost:3000/api/v1/live/state"

# Residential Proxy / VPS IP pools (Midnight Blizzard style)
RESIDENTIAL_SUBNETS = [
    "185.220.101",
    "194.26.29",
    "198.98.56",
    "45.154.255",
    "103.149.130",
    "193.148.18",
    "91.240.118",
    "176.119.25",
]

CORPORATE_IPS = [
    f"10.0.{random.randint(1, 10)}.{random.randint(2, 250)}" for _ in range(30)
]

USER_POOL = [f"user_{i:04d}" for i in range(1, 81)] + [
    "ciso_admin",
    "finance_lead",
    "corp_vp",
    "it_support",
    "service_account",
]

# Track current active campaign state
CURRENT_CAMPAIGN_IPS = []
CURRENT_TARGET_USERS = []

def post_event(ip: str, user: str, outcome: str = "FAILURE") -> bool:
    payload = {
        "ip": ip,
        "user": user,
        "outcome": outcome,
        "timestamp": time.time(),
    }
    data = json.dumps(payload).encode("utf-8")

    try:
        # Try requests if installed, else fallback to standard urllib
        try:
            import requests
            resp = requests.post(API_URL, json=payload, timeout=2.0)
            return resp.status_code == 200
        except ImportError:
            import urllib.request
            req = urllib.request.Request(
                API_URL,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                return resp.status == 200
    except Exception as e:
        print(f"  [!] Failed to deliver event to {API_URL}: {e}")
        return False

def reset_state():
    print("\n🔵 [RESET] Resetting Quorum Live State...")
    try:
        import urllib.request
        req = urllib.request.Request(
            RESET_URL,
            data=json.dumps({"action": "reset"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            print("  ✓ Engine memory buffer wiped. Ready for fresh scenario.")
    except Exception as e:
        print(f"  [!] Reset error: {e}")

def run_baseline(count: int = 15):
    print(f"\n🟢 [STATE_BASELINE] Injecting {count} benign enterprise authentications...")
    for i in range(count):
        ip = random.choice(CORPORATE_IPS)
        user = random.choice(USER_POOL)
        outcome = "SUCCESS" if random.random() < 0.95 else "FAILURE"
        post_event(ip, user, outcome)
        sys.stdout.write(f"\r  → [{i+1}/{count}] {outcome} | {user} @ {ip}")
        sys.stdout.flush()
        time.sleep(random.uniform(0.15, 0.45))
    print("\n  ✓ Baseline established. SIEM volume rules: 0 alerts.")

def run_spray(num_ips: int = 12, num_targets: int = 35):
    global CURRENT_CAMPAIGN_IPS, CURRENT_TARGET_USERS
    print(f"\n🟡 [STATE_SPRAY] Launching Low-and-Slow Bipartite Attack...")
    print(f"  Topological Graph: {num_ips} residential proxies targeting {num_targets} accounts")

    # Generate distinct residential IPs
    CURRENT_CAMPAIGN_IPS = [
        f"{random.choice(RESIDENTIAL_SUBNETS)}.{random.randint(2, 254)}"
        for _ in range(num_ips)
    ]
    CURRENT_TARGET_USERS = random.sample(USER_POOL, min(num_targets, len(USER_POOL)))

    event_count = 0
    # Each proxy IP tries 2-3 target accounts (strictly sub-threshold: bypasses naive >= 5 fails/IP rule)
    for ip in CURRENT_CAMPAIGN_IPS:
        # Select 2-4 targets for this proxy leg
        subset_targets = random.sample(CURRENT_TARGET_USERS, min(random.randint(2, 4), len(CURRENT_TARGET_USERS)))
        for user in subset_targets:
            event_count += 1
            post_event(ip, user, "FAILURE")
            sys.stdout.write(f"\r  ⚡ Proxy Leg: {ip} -> {user} [FAILURE] (event #{event_count})")
            sys.stdout.flush()
            # Stochastic timing jitter: 200ms - 600ms
            time.sleep(random.uniform(0.20, 0.55))

    print(f"\n  ✓ Spray complete: {event_count} events dispatched. Naive rules blind (<5 fails/IP).")
    print(f"  ✓ Bipartite graph Union-Find should now detect cluster.")

def run_pivot():
    global CURRENT_CAMPAIGN_IPS, CURRENT_TARGET_USERS
    print("\n🔴 [STATE_PIVOT] Executing Post-Spray Compromise Pivot...")

    if not CURRENT_CAMPAIGN_IPS or not CURRENT_TARGET_USERS:
        # Fallback if spray wasn't run first
        CURRENT_CAMPAIGN_IPS = [f"185.220.101.{random.randint(10, 99)}"]
        CURRENT_TARGET_USERS = ["user_0001"]

    pivot_ip = random.choice(CURRENT_CAMPAIGN_IPS)
    pivot_user = random.choice(CURRENT_TARGET_USERS)

    print(f"  🎯 Compromised Credential Verified:")
    print(f"     Account : {pivot_user}")
    print(f"     Proxy IP: {pivot_ip}")
    print(f"     Outcome : SUCCESS (Valid Token Issued)")

    post_event(pivot_ip, pivot_user, "SUCCESS")
    print(f"\n  🔥 CRITICAL INCIDENT ESCALATED: Base 100 x 1.00 + 15 -> 100 [CRITICAL]")
    print(f"  ✓ Screen-wide Crimson Pulse and audio drone triggered in UI.")

def run_full_sequence():
    print("=" * 60)
    print("QUORUM LIVE DEMONSTRATION ORCHESTRATOR")
    print("=" * 60)
    reset_state()
    time.sleep(1.0)
    run_baseline(12)
    time.sleep(2.0)
    run_spray(num_ips=12, num_targets=35)
    time.sleep(2.5)
    run_pivot()
    print("\n" + "=" * 60)
    print("LIVE DEMO SEQUENCE COMPLETE")
    print("=" * 60)

def interactive_cli():
    while True:
        print("\n" + "=" * 45)
        print(" QUORUM PUPPETEER — LIVE CONTROLLER")
        print("=" * 45)
        print(" [1] 🟢 Baseline Mode (Noise)")
        print(" [2] 🟡 Spray Mode (Bipartite Graph Attack)")
        print(" [3] 🔴 Pivot Mode (Breach / Climax)")
        print(" [4] 🚀 Full Automated Sequence (1 -> 2 -> 3)")
        print(" [5] 🔵 Reset Engine State")
        print(" [0] Exit")
        print("=" * 45)
        try:
            choice = input("Select Stage > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if choice == "1":
            run_baseline()
        elif choice == "2":
            run_spray()
        elif choice == "3":
            run_pivot()
        elif choice == "4":
            run_full_sequence()
        elif choice == "5":
            reset_state()
        elif choice in ("0", "q", "exit"):
            break
        else:
            print("Invalid option.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quorum Live Scenario Controller")
    parser.add_argument("--auto", action="store_true", help="Run the full automated sequence")
    parser.add_argument("--stage", choices=["baseline", "spray", "pivot", "reset"], help="Run a single stage")
    args = parser.parse_args()

    if args.auto:
        run_full_sequence()
    elif args.stage == "baseline":
        run_baseline()
    elif args.stage == "spray":
        run_spray()
    elif args.stage == "pivot":
        run_pivot()
    elif args.stage == "reset":
        reset_state()
    else:
        interactive_cli()
