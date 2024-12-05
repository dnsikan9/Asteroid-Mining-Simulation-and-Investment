;; Mining Simulation Contract

(define-map mining-operations
  { asteroid-id: uint }
  {
    active: bool,
    start-block: uint,
    extracted-resources: uint,
    efficiency: uint
  }
)

(define-constant err-not-owner (err u100))
(define-constant err-already-active (err u101))
(define-constant err-not-active (err u102))

(define-public (start-mining (asteroid-id uint))
  (let
    ((owner (unwrap! (contract-call? .asteroid-mining-nft get-owner asteroid-id) err-not-owner)))
    (asserts! (is-eq tx-sender (unwrap! owner err-not-owner)) err-not-owner)
    (asserts! (is-none (map-get? mining-operations { asteroid-id: asteroid-id })) err-already-active)
    (map-set mining-operations
      { asteroid-id: asteroid-id }
      {
        active: true,
        start-block: block-height,
        extracted-resources: u0,
        efficiency: u100
      }
    )
    (ok true)
  )
)

(define-public (stop-mining (asteroid-id uint))
  (let
    ((owner (unwrap! (contract-call? .asteroid-mining-nft get-owner asteroid-id) err-not-owner))
     (operation (unwrap! (map-get? mining-operations { asteroid-id: asteroid-id }) err-not-active)))
    (asserts! (is-eq tx-sender (unwrap! owner err-not-owner)) err-not-owner)
    (asserts! (get active operation) err-not-active)
    (map-set mining-operations
      { asteroid-id: asteroid-id }
      (merge operation { active: false })
    )
    (ok true)
  )
)

(define-read-only (get-mining-data (asteroid-id uint))
  (map-get? mining-operations { asteroid-id: asteroid-id })
)

(define-public (simulate-extraction (asteroid-id uint))
  (let
    ((operation (unwrap! (map-get? mining-operations { asteroid-id: asteroid-id }) err-not-active))
     (asteroid (unwrap! (contract-call? .asteroid-mining-nft get-asteroid-data asteroid-id) err-not-owner))
     (blocks-mined (- block-height (get start-block operation)))
     (new-resources (/ (* blocks-mined (get resource-richness asteroid) (get efficiency operation)) u100)))
    (asserts! (get active operation) err-not-active)
    (map-set mining-operations
      { asteroid-id: asteroid-id }
      (merge operation
        {
          extracted-resources: (+ (get extracted-resources operation) new-resources),
          start-block: block-height
        }
      )
    )
    (ok new-resources)
  )
)

