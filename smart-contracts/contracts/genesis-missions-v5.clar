;; genesis-missions-v5.clar
;; Logic Contract: Handles task tracking and daily check-ins

(define-constant REWARD-CHECKIN u20)
(define-constant BLOCKS-PER-DAY u144)
(define-constant err-unauthorized (err u401))
(define-constant err-too-soon (err u500))
(define-constant err-already-done (err u501))

;; Variabel untuk menyimpan alamat contract core v5 nanti
(define-data-var game-core-address principal tx-sender)

;; Map database
(define-map last-checkin-block principal uint)
(define-map completed-tasks { user: principal, task-id: uint } bool)

;; ==========================================
;; ADMIN / AUTHORIZATION
;; ==========================================
(define-public (set-game-core (new-core principal))
  (begin
    (asserts! (is-eq tx-sender (var-get game-core-address)) err-unauthorized)
    (var-set game-core-address new-core)
    (ok true)
  ))

;; ==========================================
;; READ-ONLY FUNCTIONS (UNTUK FRONTEND)
;; ==========================================
(define-read-only (can-check-in (user principal))
  (let ((last-block (default-to u0 (map-get? last-checkin-block user))) (current-block block-height))
    (if (or (is-eq last-block u0) (> (- current-block last-block) BLOCKS-PER-DAY)) true false)))

(define-read-only (is-task-done (user principal) (task-id uint))
  (default-to false (map-get? completed-tasks { user: user, task-id: task-id })))

;; ==========================================
;; PUBLIC FUNCTIONS (HANYA DIPANGGIL OLEH CORE V5)
;; ==========================================
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
