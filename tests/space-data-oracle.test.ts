import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let spaceData: { [key: string]: any } = {}
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

// Mock contract functions
const updateSpaceData = (sender: string, missionId: string, data: string) => {
  if (sender !== contractOwner) {
    return { success: false, error: 'ERR_OWNER_ONLY' }
  }
  spaceData[missionId] = {
    timestamp: Date.now(),
    data: data
  }
  return { success: true }
}

const getSpaceData = (missionId: string) => {
  return spaceData[missionId] || null
}

describe('Space Data Oracle', () => {
  beforeEach(() => {
    spaceData = {}
  })
  
  it('should allow contract owner to update space data', () => {
    const missionId = 'OSIRIS-REx'
    const data = 'Asteroid Bennu sample collection successful'
    
    const result = updateSpaceData(contractOwner, missionId, data)
    expect(result.success).toBe(true)
    
    const storedData = getSpaceData(missionId)
    expect(storedData).toBeTruthy()
    expect(storedData.data).toBe(data)
  })
  
  it('should prevent non-owner from updating space data', () => {
    const unauthorizedUser = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const missionId = 'OSIRIS-REx'
    const data = 'Unauthorized update attempt'
    
    const result = updateSpaceData(unauthorizedUser, missionId, data)
    expect(result.success).toBe(false)
    expect(result.error).toBe('ERR_OWNER_ONLY')
  })
  
  it('should return null for non-existent mission data', () => {
    const missionId = 'NON-EXISTENT-MISSION'
    
    const result = getSpaceData(missionId)
    expect(result).toBeNull()
  })
  
  it('should maintain separate data for different missions', () => {
    const mission1 = 'OSIRIS-REx'
    const data1 = 'Asteroid Bennu sample collection successful'
    const mission2 = 'DART'
    const data2 = 'Successful impact with Dimorphos'
    
    updateSpaceData(contractOwner, mission1, data1)
    updateSpaceData(contractOwner, mission2, data2)
    
    const storedData1 = getSpaceData(mission1)
    const storedData2 = getSpaceData(mission2)
    
    expect(storedData1.data).toBe(data1)
    expect(storedData2.data).toBe(data2)
  })
})

