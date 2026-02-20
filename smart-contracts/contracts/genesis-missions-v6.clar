;; genesis-missions-v6.clar
;; Logic Contract: Handles task tracking and daily check-ins

(define-constant REWARD-CHECKIN u20)
(define-constant BLOCKS-PER-DAY u144)

;; Error Codes
(define-constant err-admin-only (err u400)) ;; Error jika bukan wallet admin yang panggil
(define-constant err-unauthorized (err u401)) ;; Error jika bukan core contract yang panggil
(define-constant err-too-soon (err u500))
(define-constant err-already-done (err u501))

;; SISTEM OTORISASI GANDA
;; admin: Wallet Anda (Tetap punya akses kontrol selamanya)
;; game-core-address: Alamat kontrak Core (Bisa diganti oleh admin)
(define-data-var admin principal tx-sender)
(define-data-var game-core-address principal tx-sender)

;; Map database
(define-map last-checkin-block principal uint)
(define-map completed-tasks { user: principal, task-id: uint } bool)

;; ==========================================
;; ADMIN FUNCTIONS
;; ==========================================

;; Hanya Wallet Admin yang bisa memanggil fungsi ini
(define-public (set-game-core (new-core principal))
  (begin
    ;; Perbaikan: Cek ke (var-get admin), bukan ke game-core-address
    (asserts! (is-eq tx-sender (var-get admin)) err-admin-only)
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
;; PUBLIC FUNCTIONS (HANYA DIPANGGIL OLEH CORE V6)
;; ==========================================
(define-public (record-check-in (user principal))
  (begin
    ;; Tetap divalidasi agar hanya Core v6 yang sah yang bisa menambah XP
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
