;; Governance Contract

(define-map proposals
  { proposal-id: uint }
  {
    title: (string-utf8 256),
    description: (string-utf8 1024),
    proposer: principal,
    yes-votes: uint,
    no-votes: uint,
    start-block: uint,
    end-block: uint,
    executed: bool
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  { vote: bool }
)

(define-data-var proposal-count uint u0)

(define-constant voting-period u144) ;; Approximately 1 day
(define-constant err-not-found (err u100))
(define-constant err-already-voted (err u101))
(define-constant err-voting-closed (err u102))

(define-public (create-proposal (title (string-utf8 256)) (description (string-utf8 1024)))
  (let
    ((new-proposal-id (+ (var-get proposal-count) u1)))
    (map-set proposals
      { proposal-id: new-proposal-id }
      {
        title: title,
        description: description,
        proposer: tx-sender,
        yes-votes: u0,
        no-votes: u0,
        start-block: block-height,
        end-block: (+ block-height voting-period),
        executed: false
      }
    )
    (var-set proposal-count new-proposal-id)
    (ok new-proposal-id)
  )
)

(define-public (vote (proposal-id uint) (vote-for bool))
(let
  ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found)))
  (asserts! (<= block-height (get end-block proposal)) err-voting-closed)
  (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)
  (map-set votes { proposal-id: proposal-id, voter: tx-sender } { vote: vote-for })
  (map-set proposals { proposal-id: proposal-id }
    (merge proposal
      {
        yes-votes: (+ (get yes-votes proposal) (if vote-for u1 u0)),
        no-votes: (+ (get no-votes proposal) (if vote-for u0 u1))
      }
    )
  )
  (ok true)
)
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

