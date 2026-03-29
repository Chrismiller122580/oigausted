import { defineConfig } from 'prisma/config'

export default defineConfig({
  db: {
    url: 'file:./dev.db',
  },
})
