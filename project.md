LeakProof X
Private Whistleblowing and Confidential Case Review on Fhenix
1. What is our app?

LeakProof X is a privacy-first whistleblowing and compliance reporting platform built on Fhenix.

It allows employees, insiders, contractors, or witnesses to report sensitive incidents such as:

fraud
harassment
corruption
policy violations
financial misconduct
compliance breaches

without exposing their identity or the content of the report publicly.

Unlike normal forms, email inboxes, or centralized reporting tools, LeakProof X keeps the report lifecycle confidential by design. Reports, case metadata, reviewer votes, and decisions remain protected through encrypted smart contract state, while still allowing structured workflows, review logic, and selective disclosure when needed. This directly fits Fhenix’s pitch around computing on encrypted data, privacy-preserving smart contracts, and selective disclosure.

2. What problem does it solve?

Today, whistleblowing is broken.

People often do not report serious wrongdoing because:

they fear retaliation
their identity may leak
internal systems are not trusted
evidence may be tampered with
reviews may be biased or politically influenced
there is no verifiable audit trail

Traditional platforms are weak because even if they look “private,” the backend operator often still controls the data, can inspect it, or can be compelled to reveal it.

LeakProof X solves this by making privacy an architectural primitive, not a feature.

That matches the buildathon’s thesis that most protocols are transparent by default, but sensitive workflows need confidentiality built into the system from day one.

3. What does our app do?

LeakProof X lets users:

submit confidential reports
attach encrypted evidence references
stay pseudonymous or selectively reveal later
have their case reviewed privately
receive a confidential case outcome
grant limited access only to authorized parties

In short:

It creates a secure on-chain workflow for sensitive reporting, private review, and controlled disclosure.

4. Core idea in one line

LeakProof X enables secure whistleblowing with encrypted reports, private reviewer voting, and selective disclosure using Fhenix confidential compute.

5. Why this is a strong Fhenix app

Your buildathon page emphasizes:

privacy-preserving computation
encrypted smart contract state
selective disclosure
confidential governance
RWA/compliance use cases
production-ready dev tools like Solidity libraries, CoFHE SDK, React hooks, and Hardhat support

LeakProof X fits that extremely well because it is not just “an anonymous form.”

It is a full confidential workflow application, where:

data stays encrypted
logic runs on encrypted state
access is permissioned
only authorized viewers can decrypt outcomes
reviewers can act without exposing sensitive content publicly

That gives you a better story than a generic privacy app.

6. Who is this for?
Primary users
employees
contractors
internal auditors
legal/compliance teams
DAOs
Web3 teams
privacy-first organizations
Potential markets
enterprise internal reporting
DAO dispute reporting
HR misconduct reporting
anti-fraud investigation workflows
procurement corruption reporting
confidential governance escalations
7. How the app works
Step 1: Reporter creates a case

The reporter opens the app and submits:

report title
report category
detailed description
severity level
organization / department
encrypted evidence reference
optional identity commitment

Before submission, sensitive fields are encrypted client-side.

Step 2: Data is stored privately

The encrypted payload is sent to the Fhenix smart contract.

The contract stores:

encrypted case details
encrypted metadata
encrypted status fields
encrypted reviewer results
evidence hash / encrypted CID reference

The evidence file itself can be encrypted and stored off-chain, for example through IPFS, with only the reference or hash anchored in the workflow.

Step 3: Reviewers evaluate privately

Authorized reviewers are assigned to the case.

They privately submit:

credibility score
severity score
recommendation
approve / reject / escalate vote
optional encrypted comment
Step 4: The contract computes case state

Using Fhenix confidential compute, the protocol evaluates private workflow rules such as:

whether enough reviewers approved
whether risk score crossed a threshold
whether the case should be escalated
whether more evidence is required

This is the main technical showcase:
the application performs workflow logic over encrypted state. That is exactly the type of privacy-native architecture the buildathon is promoting.

Step 5: Selective disclosure happens only when needed

Authorized parties such as compliance officers or auditors can access only the fields they are permitted to see.

Possible disclosure modes:

reveal final decision only
reveal summary but not reporter identity
reveal evidence reference but not all metadata
reveal reporter identity only under special conditions
8. Main features
A. Encrypted report submission

Users submit sensitive reports privately without exposing content on-chain.

Includes:
encrypted title
encrypted category
encrypted description
encrypted severity
encrypted department or target entity
encrypted evidence pointer
B. Private evidence anchoring

The app supports confidential evidence workflows.

Includes:
client-side encrypted files
IPFS/off-chain evidence storage
on-chain evidence hash / encrypted CID
tamper-evident proof that evidence was submitted
C. Confidential reviewer voting

Reviewers evaluate the case privately.

Includes:
encrypted reviewer vote
encrypted confidence score
encrypted risk score
optional encrypted reviewer notes
D. Encrypted workflow decisions

Smart contracts compute case progression without exposing the full data.

Includes:
escalate / reject / investigate logic
threshold-based private scoring
stage transition based on encrypted inputs
E. Selective disclosure

The app reveals only what is necessary.

Includes:
role-based access control
outcome reveal
summary reveal
evidence access permissions
conditional identity reveal
F. Audit trail without public leakage

The app maintains process integrity without sacrificing confidentiality.

Includes:
immutable case creation
reviewer actions logged as private workflow events
verifiable state changes
permission history
9. Extra features you should mention

These make the app feel more serious and “future ready.”

1. Anonymous reputation score

Reporters can earn a hidden credibility history without revealing identity.

This lets the system detect:

repeat malicious spam
trusted repeat contributors
behavior patterns
2. Time-locked disclosure

Identity or evidence can automatically unlock only after:

multiple approvals
legal trigger
expiration date
emergency governance override
3. Multi-reviewer consensus engine

Case moves forward only if:

2 of 3 reviewers approve
average risk score exceeds threshold
senior reviewer confirms escalation
4. Encrypted case categories

Even the nature of the complaint can remain hidden from the public.

5. DAO or board review mode

The same architecture can support:

private DAO dispute reviews
confidential board investigations
treasury misconduct reporting
6. Reward or bounty layer

In a future version, valid reports could unlock confidential bounty payments using privacy-preserving payment rails, which aligns well with the buildathon’s mention of Privara and confidential payment flows.

7. Selective legal export

A case can generate a disclosure package for:

legal team
regulator
arbitration partner
investigator
8. Anti-spam gate

Require a deposit, credential, or private access token before a report can be submitted.

9. Escalation tiers

Cases can move through:

submitted
under review
needs evidence
escalated
verified
closed
10. Emergency kill/review pause

Admins can pause new reviews if abuse is detected, without exposing submitted case contents.

10. Best product positioning

Use this positioning:

LeakProof X is a privacy-by-design reporting and case review protocol for sensitive disclosures.

It enables users to submit encrypted reports, attach verifiable evidence, and undergo confidential review workflows without exposing identities or sensitive case data on public rails.

That language fits Fhenix’s “privacy-by-design” framing very cleanly.

11. Best architecture for the app

Here is the strongest architecture for both privacy and hackathon feasibility.

Frontend
Next.js / React
wallet connection
reporter dashboard
reviewer dashboard
admin / disclosure dashboard

Why:
The buildathon explicitly highlights React hooks and frontend productivity tooling.

Smart contract layer
Solidity on Fhenix
encrypted types and confidential operations
private workflow logic in contracts

Why:
The page explicitly calls out Solidity libraries for encrypted operations and smart contracts on encrypted state.

Privacy SDK layer
CoFHE SDK
client-side encryption
decryption permits
user-side access controls
Storage layer
encrypted file blob storage
IPFS or similar decentralized storage
only hash/reference on-chain
Access control layer
reviewer permissions
case-based disclosure rights
role-based decryption access
audit access rules
Optional application layer
Privara integration
useful later for confidential rewards, payouts, reimbursements, or compliance-linked payment flows, because the buildathon highlights Privara as an application-layer privacy tool for payment and financial primitives.
12. Recommended technical architecture
Contract 1: CaseRegistry

Handles:

case creation
encrypted storage of report data
status transitions
case metadata commitments
Stores:
encrypted title
encrypted description
encrypted severity
encrypted category
encrypted evidence reference
encrypted state
Contract 2: ReviewerHub

Handles:

reviewer assignment
reviewer permissions
encrypted vote submission
encrypted score aggregation
Stores:
reviewer roles
encrypted votes
encrypted scoring payloads
review completion state
Contract 3: DisclosureController

Handles:

who can decrypt what
when disclosure is allowed
selective reveal logic
conditional identity release
Stores:
case permissions
reveal conditions
emergency override rules
disclosure logs
Contract 4: IdentityCommitment optional

Handles:

reporter pseudonymous identity commitment
optional proof of organization membership
non-public reporter linkage

This is optional for MVP.

13. Best privacy model

This is the most important part of your architecture story.

Privacy principles
1. Encrypt before chain

Sensitive report data should never be posted as plaintext.

2. Keep logic private

Voting, scoring, and escalation should operate on encrypted values.

3. Reveal minimally

Only final outcome or restricted summary should be visible to authorized parties.

4. Separate evidence from chain

Store large files off-chain, encrypted; keep only proof/reference on-chain.

5. Use role-based disclosure

A reviewer should not automatically see reporter identity.
An admin should not automatically see full evidence.
A legal officer should only see what is required.

6. Preserve auditability

Even with confidentiality, process changes should remain verifiable.

This matches the buildathon language around confidential compute, selective disclosure, and privacy-first UX patterns.

14. Suggested app flow
Reporter flow
connect wallet
create secure case
encrypt content locally
upload encrypted evidence
submit case
receive case ID
track status privately
Reviewer flow
view assigned cases
decrypt allowed summary only
score case privately
vote privately
submit encrypted review
Admin / compliance flow
monitor case stages
assign reviewers
decrypt allowed outcome fields
trigger selective disclosure if required