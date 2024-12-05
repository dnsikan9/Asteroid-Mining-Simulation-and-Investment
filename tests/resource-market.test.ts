import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let userResources: { [key: string]: number } = {}
let tokenBalances: { [key: string]: number } = {}
let resourcePrice: number = 100 // Initial price: 100 microstacks per resource unit

// Mock contract functions
const addResources = (sender: string, amount: number) => {
  userResources[sender] = (userResources[sender] || 0) + amount
  tokenBalances[sender] = (tokenBalances[sender] || 0) + amount
  return { success: true }
}

const sellResources = (sender: string, amount: number) => {
  if ((userResources[sender] || 0) < amount) {
    return { success: false, error: 'ERR_INSUFFICIENT_RESOURCES' }
  }
  const saleValue = amount * resourcePrice
  userResources[sender] -= amount
  tokenBalances[sender] -= amount
  tokenBalances[sender] += saleValue
  return { success: true, value: saleValue }
}

const buyResources = (sender: string, amount: number) => {
  const purchaseCost = amount * resourcePrice
  if ((tokenBalances[sender] || 0) < purchaseCost) {
    return { success: false, error: 'ERR_INSUFFICIENT_FUNDS' }
  }
  tokenBalances[sender] -= purchaseCost
  userResources[sender] = (userResources[sender] || 0) + amount
  return { success: true, value: amount }
}

const getResourcePrice = () => {
  return { success: true, value: resourcePrice }
}

const updateResourcePrice = (sender: string, newPrice: number) => {
  if (sender !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
    return { success: false, error: 'ERR_OWNER_ONLY' }
  }
  resourcePrice = newPrice
  return { success: true }
}

const getUserBalance = (user: string) => {
  return { success: true, value: userResources[user] || 0 }
}

describe('Resource Market', () => {
  beforeEach(() => {
    userResources = {}
    tokenBalances = {}
    resourcePrice = 100
  })
  
  it('should allow adding resources', () => {
    const result = addResources('user1', 1000)
    expect(result.success).toBe(true)
    expect(userResources['user1']).toBe(1000)
    expect(tokenBalances['user1']).toBe(1000)
  })
  
  it('should allow selling resources', () => {
    addResources('user1', 1000)
    const result = sellResources('user1', 500)
    expect(result.success).toBe(true)
    expect(result.value).toBe(50000) // 500 * 100
    expect(userResources['user1']).toBe(500)
    expect(tokenBalances['user1']).toBe(50500) // 1000 - 500 + 50000
  })
  
  it('should prevent selling more resources than owned', () => {
    addResources('user1', 1000)
    const result = sellResources('user1', 1500)
    expect(result.success).toBe(false)
    expect(result.error).toBe('ERR_INSUFFICIENT_RESOURCES')
    expect(userResources['user1']).toBe(1000)
  })
  
  it('should allow buying resources', () => {
    tokenBalances['user1'] = 10000
    const result = buyResources('user1', 50)
    expect(result.success).toBe(true)
    expect(result.value).toBe(50)
    expect(userResources['user1']).toBe(50)
    expect(tokenBalances['user1']).toBe(5000) // 10000 - (50 * 100)
  })
  
  it('should prevent buying resources with insufficient funds', () => {
    tokenBalances['user1'] = 1000
    const result = buyResources('user1', 20)
    expect(result.success).toBe(false)
    expect(result.error).toBe('ERR_INSUFFICIENT_FUNDS')
    expect(userResources['user1']).toBeUndefined()
    expect(tokenBalances['user1']).toBe(1000)
  })
  
  it('should allow getting the resource price', () => {
    const result = getResourcePrice()
    expect(result.success).toBe(true)
    expect(result.value).toBe(100)
  })
  
  it('should allow the contract owner to update the resource price', () => {
    const result = updateResourcePrice('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 150)
    expect(result.success).toBe(true)
    expect(resourcePrice).toBe(150)
  })
  
  it('should prevent non-owners from updating the resource price', () => {
    const result = updateResourcePrice('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 150)
    expect(result.success).toBe(false)
    expect(result.error).toBe('ERR_OWNER_ONLY')
    expect(resourcePrice).toBe(100)
  })
  
  it('should allow getting user balance', () => {
    addResources('user1', 1000)
    const result = getUserBalance('user1')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1000)
  })
  
  it('should return zero balance for users with no resources', () => {
    const result = getUserBalance('user2')
    expect(result.success).toBe(true)
    expect(result.value).toBe(0)
  })
})

