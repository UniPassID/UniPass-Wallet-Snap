import { LocalStorageService } from '@/store/storages'
import DB from '@/store/index_db'

export const clearStorage = async () => {
  await DB.clearAccountInfo()
  LocalStorageService.clearAll()
}
