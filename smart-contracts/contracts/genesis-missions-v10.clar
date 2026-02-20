;; genesis-missions-v10.clar
(define-constant REWARD-CHECKIN u20)
(define-constant BLOCKS-PER-DAY u144)

(define-constant err-admin-only (err u400))
(define-constant err-unauthorized (err u401))
(define-constant err-too-soon (err u500))
(define-constant err-already-done (err u501))

(define-data-var admin principal tx-sender)
(define-data-var game-core-address principal tx-sender)

(define-map last-checkin-block principal uint)
(define-map completed-tasks { user: principal, task-id: uint } bool)

(define-public (set-game-core (new-core principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) err-admin-only)
    (var-set game-core-address new-core)
    (ok true)))

(define-public (record-check-in (user principal))
  (begin
    (asserts! (is-eq tx-sender (var-get game-core-address)) err-unauthorized)
    (asserts! (can-check-in user) err-too-soon)
    (map-set last-checkin-block user block-height)
    (ok REWARD-CHECKIN)))

(define-public (record-task (user principal) (task-id uint) (reward uint))
  (begin
    (asserts! (is-eq tx-sender (var-get game-core-address)) err-unauthorized)
    (asserts! (not (is-task-done user task-id)) err-already-done)
    (map-set completed-tasks { user: user, task-id: task-id } true)
    (ok reward)))

(define-read-only (can-check-in (user principal))
  (let ((last-block (default-to u0 (map-get? last-checkin-block user))) 
        (current-block block-height))
    (if (or (is-eq last-block u0) (> (- current-block last-block) BLOCKS-PER-DAY)) true false)))

(define-read-only (is-task-done (user principal) (task-id uint))
  (default-to false (map-get? completed-tasks { user: user, task-id: task-id })))
