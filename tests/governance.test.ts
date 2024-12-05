import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let proposals: { [key: number]: any } = {}
let votes: { [key: string]: { vote: boolean } } = {}
let proposalCount = 0
const blockHeight = 123456

// Mock contract functions
const createProposal = (sender: string, title: string, description: string) => {
  proposalCount++
  proposals[proposalCount] = {
    title,
    description,
    proposer: sender,
    yes_votes: 0,
    no_votes: 0,
    start_block: blockHeight,
    end_block: blockHeight + 144, // voting_period
    executed: false
  }
  return { success: true, value: proposalCount }
}

const vote = (sender: string, proposalId: number, voteFor: boolean) => {
  const proposal = proposals[proposalId]
  if (!proposal) {
    return { success: false, error: 100 }
  }
  
  if (blockHeight > proposal.end_block) {
    return { success: false, error: 102 }
  }
  
  const voteKey = `${proposalId}:${sender}`
  if (votes[voteKey]) {
    return { success: false, error: 101 }
  }
  
  votes[voteKey] = { vote: voteFor }
  if (voteFor) {
    proposal.yes_votes++
  } else {
    proposal.no_votes++
  }
  
  return { success: true }
}

const getProposal = (proposalId: number) => {
  return proposals[proposalId] || null
}

const getVote = (proposalId: number, voter: string) => {
  return votes[`${proposalId}:${voter}`] || null
}

describe('Governance', () => {
  beforeEach(() => {
    proposals = {}
    votes = {}
    proposalCount = 0
  })
  
  it('should create a new proposal', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const title = 'Increase mining efficiency'
    const description = 'Proposal to increase mining efficiency by 10%'
    
    const result = createProposal(wallet1, title, description)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const proposal = getProposal(1)
    expect(proposal).toBeTruthy()
    expect(proposal.title).toBe(title)
    expect(proposal.description).toBe(description)
    expect(proposal.proposer).toBe(wallet1)
    expect(proposal.yes_votes).toBe(0)
    expect(proposal.no_votes).toBe(0)
  })
  
  it('should allow voting on proposals', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createProposal(wallet1, 'Test Proposal', 'Test Description')
    
    const voteResult1 = vote(wallet1, 1, true)
    const voteResult2 = vote(wallet2, 1, false)
    
    expect(voteResult1.success).toBe(true)
    expect(voteResult2.success).toBe(true)
    
    const proposal = getProposal(1)
    expect(proposal.yes_votes).toBe(1)
    expect(proposal.no_votes).toBe(1)
  })
  
  it('should prevent double voting', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    createProposal(wallet1, 'Test Proposal', 'Test Description')
    
    const firstVote = vote(wallet1, 1, true)
    const secondVote = vote(wallet1, 1, true)
    
    expect(firstVote.success).toBe(true)
    expect(secondVote.success).toBe(false)
    expect(secondVote.error).toBe(101)
  })
  
  it('should prevent voting on expired proposals', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    createProposal(wallet1, 'Test Proposal', 'Test Description')
    
    // Manually expire the proposal by setting end_block
    proposals[1].end_block = blockHeight - 1
    
    const voteResult = vote(wallet1, 1, true)
    expect(voteResult.success).toBe(false)
    expect(voteResult.error).toBe(102)
  })
  
  it('should track individual votes', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    createProposal(wallet1, 'Test Proposal', 'Test Description')
    vote(wallet1, 1, true)
    
    const voteRecord = getVote(1, wallet1)
    expect(voteRecord).toBeTruthy()
    expect(voteRecord.vote).toBe(true)
  })
})

