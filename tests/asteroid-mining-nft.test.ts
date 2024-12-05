import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let nftOwners: { [key: number]: string } = {}
let asteroidData: { [key: number]: any } = {}
let lastTokenId = 0

// Mock contract functions
const mintAsteroid = (recipient: string, name: string, size: number, resourceRichness: number) => {
  lastTokenId++
  nftOwners[lastTokenId] = recipient
  asteroidData[lastTokenId] = {
    name,
    size,
    resource_richness: resourceRichness
  }
  return { success: true, value: lastTokenId }
}

const transferAsteroid = (sender: string, tokenId: number, recipient: string) => {
  if (nftOwners[tokenId] !== sender) {
    return { success: false, error: 'ERR_NOT_AUTHORIZED' }
  }
  nftOwners[tokenId] = recipient
  return { success: true }
}

const getAsteroidData = (tokenId: number) => {
  return asteroidData[tokenId] || null
}

const getOwner = (tokenId: number) => {
  return nftOwners[tokenId] || null
}

describe('Asteroid Mining NFT', () => {
  beforeEach(() => {
    nftOwners = {}
    asteroidData = {}
    lastTokenId = 0
  })
  
  it('should mint a new asteroid NFT', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const result = mintAsteroid(wallet1, 'Ceres-1', 1000, 80)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const owner = getOwner(1)
    expect(owner).toBe(wallet1)
    
    const data = getAsteroidData(1)
    expect(data).toEqual({
      name: 'Ceres-1',
      size: 1000,
      resource_richness: 80
    })
  })
  
  it('should transfer asteroid ownership', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    mintAsteroid(wallet1, 'Ceres-1', 1000, 80)
    
    const result = transferAsteroid(wallet1, 1, wallet2)
    expect(result.success).toBe(true)
    
    const newOwner = getOwner(1)
    expect(newOwner).toBe(wallet2)
  })
  
  it('should prevent unauthorized transfers', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    mintAsteroid(wallet1, 'Ceres-1', 1000, 80)
    
    const result = transferAsteroid(wallet2, 1, wallet2)
    expect(result.success).toBe(false)
    expect(result.error).toBe('ERR_NOT_AUTHORIZED')
    
    const owner = getOwner(1)
    expect(owner).toBe(wallet1)
  })
})

