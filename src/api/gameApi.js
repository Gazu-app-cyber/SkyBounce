import { http } from './http'

export async function getProfile(playerId) {
  const { data } = await http.get('/profile', { params: { playerId } })
  return data.profile
}

export async function saveProfile(profile) {
  const { data } = await http.put('/profile', profile)
  return data.profile
}

export async function removeProfile(playerId) {
  const { data } = await http.delete('/profile', { params: { playerId } })
  return data
}

export async function getLeaderboard(scope, playerId) {
  const { data } = await http.get('/leaderboard', { params: { scope, playerId } })
  return data
}

export async function postRun(run) {
  const { data } = await http.post('/leaderboard/runs', run)
  return data
}

export async function createCheckoutSession(payload) {
  const { data } = await http.post('/checkout/create-session', payload)
  return data
}

export async function verifyCheckoutSession(payload) {
  const { data } = await http.post('/checkout/verify-session', payload)
  return data
}
