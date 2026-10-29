"""Optimized Yoast SEO copy for every page, product and product category.

Edit the rows below, then rebuild the WordPress import plugin's data:

    python3 scripts/seo/yoast-copy.py --write wordpress/cooldog-seo-import/seo-data.json
    cd wordpress && zip -rq cooldog-seo-import.zip cooldog-seo-import -x '*.DS_Store'

Checks: titles <= 60 characters, descriptions 120-158, no duplicates, and each
focus keyphrase appears in its title or description.
"""
import json, sys
# (type, id, label, title, description, focus keyphrase, noindex)
P = "post"; T = "term"
rows = [
 # ---- Pages ----
 (P, 48810, "Home", "Dog Water Fountains for Dog Parks & Apartments | Cool Dog",
  "Commercial dog water fountains, bottle fillers and rinse stations for dog parks, apartments, HOAs and vet clinics. Made in the USA with contractor pricing.",
  "dog water fountains", False),
 (P, 28, "Contact Us", "Contact Us & Build a Quote | Cool Dog Water Fountains",
  "Get contractor pricing on dog water fountains. Call 800.931.1562 or email sales@gymsfordogs.com for volume quotes, color options and installer referrals.",
  "dog water fountain quote", False),
 (P, 135, "Our Mission", "Our Mission: Dog Water Fountains Made in the USA | Cool Dog",
  "Cool Dog designs and builds high-quality dog water fountains in the USA, helping dog parks and communities keep dogs healthy, hydrated and active outdoors.",
  "made in USA dog water fountains", False),
 (P, 53547, "Colors", "Dog Water Fountain Colors & Custom Finishes | Cool Dog",
  "Explore Color Play® finishes for Cool Dog water fountains: standard colors like Aqua Blue and Bone White, plus custom colors to match your park or brand.",
  "dog water fountain colors", False),
 (P, 365, "Plumbing", "Dog Water Fountain Plumbing Requirements | Cool Dog",
  "Plumbing requirements for Cool Dog water fountains: mounting surface, supply and drain lines, shut-off valve and 20–105 PSI water pressure, step by step.",
  "dog water fountain plumbing", False),
 (P, 53485, "Installation – Basin Fountains", "How to Install Dog Fountains with Basins | Cool Dog",
  "How to install Cool Dog pet fountains with basins: a sample installation plan, concrete pad layout, ADA access notes and drain options for dog parks.",
  "dog water fountain installation", False),
 (P, 60169, "Installation – Fresh Flow Fountains", "Fresh Flow Dog Fountain Installation Guide | Cool Dog",
  "Install a Fresh Flow dog water fountain on a concrete pad: five anchor bolts, a 1/2\" NPT water supply, a trench drain and at least 15 PSI of pressure.",
  "fresh flow fountain installation", False),
 (P, 53618, "Dog Park Designs", "Dog Park Design & Operations Guide | Cool Dog",
  "Plan a safe, easy-to-maintain dog park: location, size, shade, drainage, rules and daily upkeep, plus where water fountains and rinse stations fit in.",
  "dog park design", False),
 (P, 55113, "Resources", "Dog Fountain Specs for Architects & Contractors | Cool Dog",
  "Resources for architects and contractors: Cool Dog water fountain CAD details, product specifications and the national contractor order form.",
  "dog water fountain specifications", False),
 (P, 56218, "Dogs Love Water", "Why Dogs Need Fresh Water: Hydration & Health | Cool Dog",
  "Why hydration matters for dogs: how much water dogs need, how they cool down, and how fresh, flowing dog water fountains keep pets healthy at the park.",
  "dog hydration", False),
 (P, 381, "Terms and Conditions", "Terms and Conditions | Cool Dog Water Fountains",
  "Terms and conditions for quotes and purchases of Cool Dog water fountains, covering payment, shipping and freight, returns, taxes and warranty.",
  "", False),
 (P, 3, "Privacy Policy", "Privacy Policy | Cool Dog Water Fountains",
  "How Cool Dog Water Fountains collects, uses and protects your personal information when you browse our site, request a quote or place an order.",
  "", False),
 (P, 58865, "Success (form confirmation)", "Thank You – Request Received | Cool Dog Water Fountains",
  "Thanks for contacting Cool Dog Water Fountains. Our team will reply within 48 hours; for faster help call 800.931.1562, Monday through Friday.",
  "", True),
 (P, 712, "Cart", "Cart | Cool Dog Water Fountains",
  "Review the dog water fountains in your cart, update colors and quantities, and continue to secure checkout with Cool Dog Water Fountains.", "", True),
 (P, 713, "Checkout", "Checkout | Cool Dog Water Fountains",
  "Secure checkout for Cool Dog water fountains. Questions about shipping, freight or installation? Call our team at 800.931.1562 before you order.", "", True),
 (P, 714, "My Account", "My Account | Cool Dog Water Fountains",
  "Sign in to your Cool Dog Water Fountains account to view orders, track shipments and manage your billing and shipping details.", "", True),
 # ---- Products ----
 (P, 60141, "Bottle Filler w/ Pet Hose & Dog Basin (SST)", "Bottle Filler Dog Fountain with Pet Hose (SST) | Cool Dog",
  "Bottle filler, dog basin and pet hose in one stainless steel series fountain. Push-button valve, vandal-resistant finish in 3 colors. Made in the USA.",
  "bottle filler dog water fountain", False),
 (P, 60022, "Bottle Filler w/ Single Dog Basin (SST)", "Bottle Filler & Dog Water Fountain (SST) | Cool Dog",
  "Hands-free sensor bottle filler with a single dog basin for parks and trails. Stainless steel series, ADA friendly, available in 3 colors. Made in USA.",
  "bottle filler with dog bowl", False),
 (P, 60090, "Dog Bowl (SST)", "Stainless Steel Dog Bowl Water Fountain | Cool Dog",
  "Commercial dog water fountain with a polished stainless steel dog bowl, push-button valve and slow-draining basin. Vandal resistant, made in the USA.",
  "stainless steel dog bowl fountain", False),
 (P, 60065, "Dog Bowl w/ Pet Hose (SST)", "Dog Water Fountain with Pet Hose (SST) | Cool Dog",
  "Dog bowl fountain with a pet hose for cooling and rinsing dogs. Stainless steel bowl, push-button valve and a vandal-resistant finish in 3 colors.",
  "dog water fountain with pet hose", False),
 (P, 60061, "Dog Bowl w/ ADA Bowl & Pet Hose (SST)", "ADA Pet & Human Drinking Fountain with Hose | Cool Dog",
  "ADA drinking fountain for people, dog bowl and pet hose on one stainless steel series pedestal. Built for dog parks and trails; 3 colors, made in USA.",
  "ADA pet and human drinking fountain", False),
 (P, 60043, "Dog Bowl w/ ADA Bowl (SST)", "ADA Pet & Human Drinking Fountain (SST) | Cool Dog",
  "Two-level drinking fountain with an ADA bowl for people and a dog bowl near the ground. Stainless steel bowls, vandal-resistant finish, made in the USA.",
  "pet and human drinking fountain", False),
 (P, 59999, "Rinse Water Station (SST)", "Dog Rinse Station – Dual Pet Wash Post (SST) | Cool Dog",
  "Two-station dog rinse post in heavy-duty 304 stainless steel. Owners wash off mud and dirt after play; corrosion resistant, in 4 colors. Made in USA.",
  "dog rinse station", False),
 (P, 59766, "Fresh Flow – Surface Mount (lever)", "Fresh Flow Lever Dog Water Fountain | Cool Dog",
  "Basin-free dog water fountain with a lever handle for adjustable flow, so every drink is fresh, never stagnant. Surface mount, 46\" tall, 7 colors.",
  "fresh flow dog water fountain", False),
 (P, 59767, "Fresh Flow w/ Hose – Surface Mount (lever)", "Fresh Flow Dog Fountain with Pet Hose | Cool Dog",
  "Lever-handle Fresh Flow fountain with a pet hose for rinsing and cooling dogs. No basin, so water stays fresh. Surface mount, 7 colors, made in USA.",
  "fresh flow fountain with pet hose", False),
 (P, 59771, "Fresh Flow Push Button – Surface Mount", "Fresh Flow Push Button Dog Water Fountain | Cool Dog",
  "Push-button Fresh Flow dog water fountain with a self-closing valve and adjustable stream. No basin, no stagnant water. Surface mount in 7 colors.",
  "fresh flow push button fountain", False),
 (P, 59770, "Fresh Flow Push Button w/ Hose – Surface Mount", "Push Button Dog Fountain with Pet Hose | Cool Dog",
  "Self-closing push-button dog fountain plus a pet hose for rinsing. The basin-free Fresh Flow design keeps water clean. Surface mount, 7 colors.",
  "push button dog fountain with hose", False),
 (P, 59769, "Portable Fresh Flow – Free Standing w/ Rollers", "Portable Dog Water Fountain – Garden Hose Hookup | Cool Dog",
  "Portable Fresh Flow dog water fountain on a rolling base. Connects to any garden hose with no plumbing. Lever handle, 46\" tall, 7 colors, made in USA.",
  "portable fresh flow fountain", False),
 (P, 59768, "Portable Fresh Flow w/ Hose – Free Standing w/ Rollers", "Portable Dog Fountain with Pet Hose on Rollers | Cool Dog",
  "Rolling Fresh Flow dog fountain with a pet hose that hooks up to a standard garden hose. No plumbing needed; ideal for events, parks and daycares.",
  "portable dog fountain with hose", False),
 # ---- Product categories ----
 (T, 188, "Rinse Water Station", "Dog Rinse Stations for Dog Parks | Cool Dog Water Fountains",
  "Stainless steel dog rinse stations for dog parks, trails and pet-friendly properties. Two hose connections let owners wash off mud before heading home.",
  "dog rinse stations", False),
 (T, 191, "Bottle Filler & Pet Basin", "Bottle Filler Dog Water Fountains | Cool Dog",
  "Combination bottle filler and dog water fountains for parks and trails: refill bottles hands-free while dogs drink from a stainless basin. Made in USA.",
  "bottle filler dog fountains", False),
 (T, 190, "Pet & Human Basins", "Pet & Human Drinking Fountains | Cool Dog Water Fountains",
  "ADA drinking fountains for people with a built-in dog bowl below. Durable stainless steel series pedestals for dog parks, trails and public spaces.",
  "pet and human drinking fountains", False),
 (T, 189, "Pet Basin", "Dog Bowl Water Fountains | Cool Dog Water Fountains",
  "Stainless steel dog bowl water fountains with push-button valves and slow-draining basins, with or without a pet hose. Made in the USA for dog parks.",
  "dog bowl water fountains", False),
 (T, 186, "Fresh Flow – Lever Handle", "Lever Handle Dog Water Fountains | Cool Dog Water Fountains",
  "Fresh Flow lever-handle dog water fountains give smooth, adjustable flow for any size dog. The basin-free design keeps water fresh in parks and daycares.",
  "lever handle dog water fountains", False),
 (T, 187, "Fresh Flow – Push Button", "Push Button Dog Water Fountains | Cool Dog Water Fountains",
  "Fresh Flow push-button dog water fountains: a self-closing recessed button prevents continuous flow and an adjustable stream fine-tunes the pressure.",
  "push button dog water fountains", False),
 (T, 185, "Portable Fresh Flow", "Portable Dog Water Fountains | Cool Dog Water Fountains",
  "Portable Fresh Flow dog water fountains hook up to a standard garden hose with no plumbing. Rolling bases for events, parks, daycares and shelters.",
  "portable dog water fountains", False),
 (T, 159, "SST series", "Stainless Steel Series Dog Water Fountains | Cool Dog",
  "The Cool Dog stainless steel series (SST): dog bowl fountains, pet and human fountains, bottle fillers and rinse stations for busy dog parks.",
  "stainless steel dog water fountains", False),
 (T, 160, "SLV series", "Fresh Flow SLV Dog Water Fountains | Cool Dog",
  "The Fresh Flow SLV series: basin-free dog water fountains with lever or push-button flow, surface mount or portable, in seven colors. Made in the USA.",
  "fresh flow dog water fountains", False),
 (T, 170, "Shelter Strong", "Shelter Strong Dog Water Fountains | Cool Dog",
  "Shelter Strong fountains: durable, basin-free Fresh Flow dog water fountains for shelters, kennels and daycares, easy to clean and built for daily use.",
  "shelter dog water fountains", False),
]

problems = []
titles, descs, kws = {}, {}, {}
for typ, id_, label, title, desc, kw, noindex in rows:
    if len(title) > 60: problems.append(f"title {len(title)}: {title}")
    if not noindex and not 120 <= len(desc) <= 158: problems.append(f"desc {len(desc)}: {label}")
    if noindex and len(desc) > 158: problems.append(f"desc {len(desc)}: {label}")
    for store, value in ((titles, title), (descs, desc), (kws, kw)):
        if value and value.lower() in store: problems.append(f"duplicate: {value}")
        store[value.lower()] = label
    if kw and kw.lower().split()[0] not in (title + " " + desc).lower(): problems.append(f"keyphrase not used: {label}")
for p in problems: print("PROBLEM:", p)
print(f"{len(rows)} items, {len(problems)} problems")
if "--write" in sys.argv and not problems:
    data = {"version": 1, "items": [
        {"type": typ, "id": id_, "label": label, "title": title, "description": desc, "focuskw": kw, "noindex": noindex}
        for typ, id_, label, title, desc, kw, noindex in rows]}
    open(sys.argv[-1], "w").write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print("written")
