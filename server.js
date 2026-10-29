import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

const app = express();
const port = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const workspaceSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  entries: { type: [mongoose.Schema.Types.Mixed], default: [] },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });

const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);

app.get('/api/health', (_request, response) => {
  response.json({ database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/entries', async (_request, response) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ error: 'MongoDB is not connected.' });
  }
  try {
    const workspace = await Workspace.findOne({ key: 'main' }).lean();
    return response.json({ entries: workspace?.entries || [] });
  } catch (error) {
    return response.status(500).json({ error: 'Could not load entries.' });
  }
});

app.post('/api/entries/sync', async (request, response) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ error: 'MongoDB is not connected.' });
  }
  if (!Array.isArray(request.body?.entries)) {
    return response.status(400).json({ error: 'Entries must be an array.' });
  }
  try {
    await Workspace.findOneAndUpdate(
      { key: 'main' },
      { $set: { entries: request.body.entries, updatedAt: new Date() } },
      { upsert: true, new: true, runValidators: true },
    );
    return response.json({ saved: request.body.entries.length });
  } catch (error) {
    return response.status(500).json({ error: 'Could not save entries.' });
  }
});

app.listen(port, () => {
  console.log(`Daymark API listening on http://localhost:${port}`);
});

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected.'))
    .catch((error) => console.error(`MongoDB connection failed: ${error.message}`));
} else {
  console.warn('MONGODB_URI is not set; API will run in local-only mode.');
}
