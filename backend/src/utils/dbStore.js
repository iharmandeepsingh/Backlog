
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sift = require('sift').default || require('sift');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class QueryChain {


  
  constructor(dataPromise) {
    this.dataPromise = dataPromise;
    this.sortCriteria = null;
    this.limitCount = null;
    this.skipCount = null;
    this.populateFields = [];
  }

  sort(criteria) {
    this.sortCriteria = criteria;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  skip(count) {
    this.skipCount = count;
    return this;
  }

  populate(field, select) {
    this.populateFields.push({ field, select });
    return this;
  }

  async exec() {
    let results = await this.dataPromise;
    if (!Array.isArray(results)) {
      if (results && this.populateFields.length > 0) {
        results = await this._populateDoc(results);
      }
      return results;
    }

    if (this.sortCriteria) {
      const keys = Object.keys(this.sortCriteria);
      results = [...results].sort((a, b) => {
        for (const key of keys) {
          const dir = this.sortCriteria[key];
          const valA = a[key];
          const valB = b[key];
          if (valA < valB) return dir > 0 ? -1 : 1;
          if (valA > valB) return dir > 0 ? 1 : -1;
        }
        return 0;
      });
    }

    if (this.skipCount) {
      results = results.slice(this.skipCount);
    }

    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    if (this.populateFields.length > 0) {
      results = await Promise.all(results.map(doc => this._populateDoc(doc)));
    }

    return results;
  }

  async _populateDoc(doc) {
    const copy = { ...doc };
    for (const pop of this.populateFields) {
      const fName = typeof pop === 'string' ? pop : pop.field;
      const targetId = copy[fName];
      if (!targetId) continue;

      // Check users, sessions, subjects, etc.
      if (fName === 'student' || fName === 'verifiedBy') {
        const u = await models.User.findById(targetId);
        if (u) {
          copy[fName] = { _id: u._id, name: u.name, email: u.email, rollNumber: u.rollNumber, department: u.department, program: u.program };
        }
      } else if (fName === 'session') {
        const s = await models.Session.findById(targetId);
        if (s) {
          copy[fName] = s;
        }
      }
    }
    return copy;
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  _read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing to ${this.filePath}:`, e);
    }
  }

  _wrap(doc) {
    if (!doc) return null;
    const self = this;
    const wrapped = { ...doc };

    Object.defineProperty(wrapped, 'save', {
      enumerable: false,
      value: async function () {
        const all = self._read();
        const idx = all.findIndex(item => String(item._id) === String(this._id));
        this.updatedAt = new Date().toISOString();
        if (idx !== -1) {
          all[idx] = { ...this };
        } else {
          all.push({ ...this });
        }
        self._write(all);
        return this;
      }
    });

    Object.defineProperty(wrapped, 'id', {
      enumerable: false,
      get: function () {
        return this._id;
      }
    });

    return wrapped;
  }

  find(query = {}) {
    const fn = async () => {
      const all = this._read();
      let filterFn;
      try {
        filterFn = sift(query);
      } catch (e) {
        filterFn = () => true;
      }
      const matched = all.filter(item => {
        // Handle _id equality if string vs ObjectId
        if (query._id && typeof query._id === 'string' && item._id) {
          if (String(item._id) !== String(query._id)) return false;
        }
        return filterFn(item);
      });
      return matched.map(doc => this._wrap(doc));
    };
    return new QueryChain(fn());
  }

  findOne(query = {}) {
    const fn = async () => {
      const all = this._read();
      let filterFn;
      try {
        filterFn = sift(query);
      } catch (e) {
        filterFn = () => true;
      }
      const item = all.find(doc => {
        if (query._id && item._id) {
          if (String(doc._id) !== String(query._id)) return false;
        }
        return filterFn(doc);
      });
      return item ? this._wrap(item) : null;
    };
    return new QueryChain(fn());
  }

  findById(id) {
    const fn = async () => {
      if (!id) return null;
      const all = this._read();
      const item = all.find(doc => String(doc._id) === String(id));
      return item ? this._wrap(item) : null;
    };
    return new QueryChain(fn());
  }

  async create(data) {
    const all = this._read();
    const createOne = (item) => {
      const newDoc = {
        _id: item._id || crypto.randomBytes(12).toString('hex'),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        ...item
      };
      all.push(newDoc);
      return this._wrap(newDoc);
    };

    if (Array.isArray(data)) {
      const created = data.map(createOne);
      this._write(all);
      return created;
    } else {
      const created = createOne(data);
      this._write(all);
      return created;
    }
  }

  async insertMany(docs) {
    return this.create(docs);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const all = this._read();
    const idx = all.findIndex(item => String(item._id) === String(id));
    if (idx === -1) return null;

    let updatedDoc = { ...all[idx] };
    if (update.$set) {
      updatedDoc = { ...updatedDoc, ...update.$set };
    } else {
      updatedDoc = { ...updatedDoc, ...update };
    }
    updatedDoc.updatedAt = new Date().toISOString();
    all[idx] = updatedDoc;
    this._write(all);
    return this._wrap(updatedDoc);
  }

  async updateOne(query, update) {
    const all = this._read();
    let filterFn = sift(query);
    const idx = all.findIndex(doc => {
      if (query._id && doc._id) {
        if (String(doc._id) !== String(query._id)) return false;
      }
      return filterFn(doc);
    });

    if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };

    let updatedDoc = { ...all[idx] };
    if (update.$set) {
      updatedDoc = { ...updatedDoc, ...update.$set };
    } else {
      updatedDoc = { ...updatedDoc, ...update };
    }
    updatedDoc.updatedAt = new Date().toISOString();
    all[idx] = updatedDoc;
    this._write(all);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    const all = this._read();
    let filterFn = sift(query);
    let count = 0;
    const newAll = all.map(doc => {
      if (filterFn(doc)) {
        count++;
        let u = { ...doc };
        if (update.$set) {
          u = { ...u, ...update.$set };
        } else {
          u = { ...u, ...update };
        }
        u.updatedAt = new Date().toISOString();
        return u;
      }
      return doc;
    });

    this._write(newAll);
    return { matchedCount: count, modifiedCount: count };
  }

  async countDocuments(query = {}) {
    const all = this._read();
    let filterFn = sift(query);
    return all.filter(doc => filterFn(doc)).length;
  }

  async deleteOne(query) {
    const all = this._read();
    let filterFn = sift(query);
    const idx = all.findIndex(doc => filterFn(doc));
    if (idx !== -1) {
      all.splice(idx, 1);
      this._write(all);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query = {}) {
    const all = this._read();
    let filterFn = sift(query);
    const remaining = all.filter(doc => !filterFn(doc));
    const deletedCount = all.length - remaining.length;
    this._write(remaining);
    return { deletedCount };
  }

  async findByIdAndDelete(id) {
    const all = this._read();
    const idx = all.findIndex(doc => String(doc._id) === String(id));
    if (idx !== -1) {
      const removed = all.splice(idx, 1)[0];
      this._write(all);
      return this._wrap(removed);
    }
    return null;
  }
}

const models = {
  User: new Collection('users'),
  Subject: new Collection('subjects'),
  Session: new Collection('sessions'),
  Config: new Collection('configs'),
  Registration: new Collection('registrations'),
  AuditLog: new Collection('audit_logs')
};

module.exports = models;
