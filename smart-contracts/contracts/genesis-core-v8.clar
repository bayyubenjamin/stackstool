;; genesis-core-v8.clar
;; Core Contract: XP, Levels, and Badges
;; Version: Clarity 1 Compatible

(define-constant err-admin-only (err u100))
(define-constant err-badge-exists (err u101))
(define-constant err-badge-not-found (err u102))
(define-constant err-req-xp (err u601))
(define-constant err-req-level (err u602))
(define-constant err-req-prereq (err u603))
(define-constant err-already-owned (err u604))

(define-data-var admin principal tx-sender)

(define-map badge-registry (string-ascii 20) { uri: (string-ascii 256), min-xp: uint, min-level: uint, prereq: (optional (string-ascii 20)) })
(define-map user-profile principal { xp: uint, level: uint })
(define-map wallet-has-badge { user: principal, badge-name: (string-ascii 20) } bool)

(define-private (calculate-level (xp uint)) (+ (/ xp u500) u1))

(define-private (add-xp (user principal) (amount uint))
  (let ((current-data (default-to { xp: u0, level: u1 } (map-get? user-profile user))))
    (let ((new-xp (+ (get xp current-data) amount)) 
          (new-level (calculate-level new-xp)))
      (map-set user-profile user { xp: new-xp, level: new-level })
      (ok new-xp))))

(define-public (create-badge (name (string-ascii 20)) (uri (string-ascii 256)) (xp-req uint) (level-req uint) (prereq-badge (optional (string-ascii 20))))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) err-admin-only)
    (asserts! (is-none (map-get? badge-registry name)) err-badge-exists)
    (map-set badge-registry name { uri: uri, min-xp: xp-req, min-level: level-req, prereq: prereq-badge })
    (ok true)))

(define-public (daily-check-in)
  (let ((sender tx-sender)) 
    (let ((reward-response (as-contract (contract-call? .genesis-missions-v8 record-check-in sender))))
      (match reward-response 
        reward-amount (add-xp sender reward-amount) 
        err-code (err err-code)))))

(define-public (complete-mission (task-id uint) (reward uint))
  (let ((sender tx-sender)) 
    (let ((mission-response (as-contract (contract-call? .genesis-missions-v8 record-task sender task-id reward))))
      (match mission-response 
        approved-reward (add-xp sender approved-reward) 
        err-code (err err-code)))))

(define-public (claim-badge (badge-name (string-ascii 20)))
  (let ((sender tx-sender)
        (badge-rules (unwrap! (map-get? badge-registry badge-name) err-badge-not-found))
        (user-data (default-to { xp: u0, level: u1 } (map-get? user-profile sender))))
    (let ((required-xp (get min-xp badge-rules)) 
          (required-level (get min-level badge-rules)) 
          (required-prereq (get prereq badge-rules)) 
          (badge-uri (get uri badge-rules)))
      
      (asserts! (not (default-to false (map-get? wallet-has-badge { user: sender, badge-name: badge-name }))) err-already-owned)
      (asserts! (>= (get xp user-data) required-xp) err-req-xp)
      (asserts! (>= (get level user-data) required-level) err-req-level)
      
      ;; Match handling for Clarity 1 compatibility
      (match required-prereq 
        prereq-name (asserts! (default-to false (map-get? wallet-has-badge { user: sender, badge-name: prereq-name })) err-req-prereq)
        (ok true))
      
      (try! (as-contract (contract-call? .genesis-badges-v8 mint-badge sender badge-uri)))
      
      (map-set wallet-has-badge { user: sender, badge-name: badge-name } true)
      (ok true))))
