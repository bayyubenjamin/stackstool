;; genesis-badges-v9.clar
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)
(impl-trait nft-trait)

(define-non-fungible-token genesis-badge uint)

;; Error Codes
(define-constant err-admin-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-not-authorized (err u102))

;; Data Vars
(define-data-var admin principal tx-sender)
(define-data-var game-core-address principal tx-sender)
(define-data-var last-token-id uint u0)

(define-map token-uri uint (string-ascii 256))

;; --- ADMINISTRATIVE ---
(define-public (set-game-core (new-core principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) err-admin-only)
    (var-set game-core-address new-core)
    (ok true)))

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) err-admin-only)
    (var-set admin new-admin)
    (ok true)))

;; --- CORE FUNCTIONS ---
(define-public (mint-badge (recipient principal) (uri (string-ascii 256)))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (is-eq tx-sender (var-get game-core-address)) err-not-authorized)
    (try! (nft-mint? genesis-badge token-id recipient))
    (map-set token-uri token-id uri)
    (var-set last-token-id token-id)
    (ok token-id)))

;; --- SIP-009 STANDARD ---
(define-read-only (get-last-token-id) (ok (var-get last-token-id)))
(define-read-only (get-token-uri (token-id uint)) (ok (map-get? token-uri token-id)))
(define-read-only (get-owner (token-id uint)) (ok (nft-get-owner? genesis-badge token-id)))
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (nft-transfer? genesis-badge token-id sender recipient)))
