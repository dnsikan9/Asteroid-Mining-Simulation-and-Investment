;; Resource Market Contract

(define-fungible-token space-resource)

(define-data-var resource-price uint u100) ;; Initial price: 100 microstacks per resource unit

(define-map user-resources
  { user: principal }
  { balance: uint }
)

(define-constant err-insufficient-resources (err u100))
(define-constant err-insufficient-funds (err u101))
(define-constant err-owner-only (err u100))

(define-public (add-resources (amount uint))
  (let
    ((current-balance (default-to u0 (get balance (map-get? user-resources { user: tx-sender })))))
    (map-set user-resources
      { user: tx-sender }
      { balance: (+ current-balance amount) }
    )
    (ft-mint? space-resource amount tx-sender)
  )
)

(define-public (sell-resources (amount uint))
  (let
    ((user-balance (default-to u0 (get balance (map-get? user-resources { user: tx-sender }))))
     (sale-value (* amount (var-get resource-price))))
    (asserts! (>= user-balance amount) err-insufficient-resources)
    (try! (ft-burn? space-resource amount tx-sender))
    (try! (stx-transfer? sale-value contract-caller tx-sender))
    (map-set user-resources
      { user: tx-sender }
      { balance: (- user-balance amount) }
    )
    (ok sale-value)
  )
)

(define-public (buy-resources (amount uint))
  (let
    ((purchase-cost (* amount (var-get resource-price))))
    (try! (stx-transfer? purchase-cost tx-sender contract-caller))
    (try! (ft-mint? space-resource amount tx-sender))
    (ok amount)
  )
)

(define-read-only (get-resource-price)
  (ok (var-get resource-price))
)

(define-public (update-resource-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender contract-caller) err-owner-only)
    (ok (var-set resource-price new-price))
  )
)

(define-read-only (get-user-balance (user principal))
  (ok (get balance (default-to { balance: u0 } (map-get? user-resources { user: user }))))
)

