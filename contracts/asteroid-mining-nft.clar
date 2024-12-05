;; Asteroid Mining NFT Contract

(define-non-fungible-token asteroid-mining uint)

(define-data-var last-token-id uint u0)

(define-map asteroid-data
  { asteroid-id: uint }
  {
    owner: principal,
    name: (string-ascii 64),
    size: uint,
    resource-richness: uint
  }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))

(define-public (mint (recipient principal) (name (string-ascii 64)) (size uint) (resource-richness uint))
  (let
    ((new-asteroid-id (+ (var-get last-token-id) u1)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (try! (nft-mint? asteroid-mining new-asteroid-id recipient))
    (map-set asteroid-data
      { asteroid-id: new-asteroid-id }
      {
        owner: recipient,
        name: name,
        size: size,
        resource-richness: resource-richness
      }
    )
    (var-set last-token-id new-asteroid-id)
    (ok new-asteroid-id)
  )
)

(define-public (transfer (asteroid-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-owner-only)
    (try! (nft-transfer? asteroid-mining asteroid-id sender recipient))
    (map-set asteroid-data
      { asteroid-id: asteroid-id }
      (merge (unwrap! (map-get? asteroid-data { asteroid-id: asteroid-id }) err-not-found)
             { owner: recipient })
    )
    (ok true)
  )
)

(define-read-only (get-asteroid-data (asteroid-id uint))
  (map-get? asteroid-data { asteroid-id: asteroid-id })
)

(define-read-only (get-owner (asteroid-id uint))
  (ok (nft-get-owner? asteroid-mining asteroid-id))
)

