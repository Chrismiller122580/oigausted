import { defineConfig } from 'prisma/config'

export default defineConfig({
  db: {
    url: 'file:./prisma/dev.db',
  },
})