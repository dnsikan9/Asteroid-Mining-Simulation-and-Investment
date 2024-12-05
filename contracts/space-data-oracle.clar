;; Space Data Oracle Contract

(define-map space-data
  { mission-id: (string-ascii 64) }
  {
    timestamp: uint,
    data: (string-utf8 1024)
  }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))

(define-public (update-space-data (mission-id (string-ascii 64)) (data (string-utf8 1024)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set space-data
      { mission-id: mission-id }
      {
        timestamp: block-height,
        data: data
      }
    )
    (ok true)
  )
)

(define-read-only (get-space-data (mission-id (string-ascii 64)))
  (map-get? space-data { mission-id: mission-id })
)

