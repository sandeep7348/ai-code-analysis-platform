db = db.getSiblingDB('codelens');

db.createUser({
  user: 'codelens_user',
  pwd: 'codelens_pass',
  roles: [{ role: 'readWrite', db: 'codelens' }]
});

db.createCollection('analyses');
db.createCollection('users');
db.createCollection('sessions');

db.analyses.createIndex({ userId: 1, createdAt: -1 });
db.analyses.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30-day TTL
db.users.createIndex({ email: 1 }, { unique: true });

print('MongoDB initialized successfully');
