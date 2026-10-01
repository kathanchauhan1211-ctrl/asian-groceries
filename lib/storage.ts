import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { adminPortalStorage } from './firebase-admin-client'

export async function uploadImage(file: File, path: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
  const fullPath = `${path}/${fileName}`
  
  const storageRef = ref(adminPortalStorage, fullPath)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}
