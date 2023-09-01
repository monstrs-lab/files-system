export interface StorageConfiguration {
  type: 'google-storage' | 's3'
}

export default (): StorageConfiguration => ({
  type: (process.env.FILES_STORAGE_TYPE as StorageConfiguration['type']) || 's3',
})
