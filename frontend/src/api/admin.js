import client from './client'

export function fetchUsers(search = '') {
  return client
    .get('/admin/users', { params: { search: search || undefined } })
    .then((res) => res.data)
}

export function updateUserRole(id, role) {
  return client.patch(`/admin/users/${id}/role`, { role }).then((res) => res.data)
}

export function deleteUser(id) {
  return client.delete(`/admin/users/${id}`)
}
