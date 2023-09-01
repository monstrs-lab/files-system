export interface StorageConfiguration {
  provider: 'google-storage' | 's3'
}

export default (): { storage: StorageConfiguration } => ({
  storage: {
    provider: (process.env.FILES_STORAGE_PROVIDER as StorageConfiguration['provider']) || 's3',
  },
})
