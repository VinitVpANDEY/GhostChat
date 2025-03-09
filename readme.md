### Redis offers various data structures, each optimized for specific use cases. Below is a quick guide with JavaScript examples for the most commonly used Redis data structures:

# 1. Strings (Basic key-value storage)
Use Case:  Key-value storage.

``` bash
const Redis = require('ioredis');
const redis = new Redis();

// Set a value
await redis.set('key', 'value');

// Get a value
const value = await redis.get('key');
console.log(value); // Output: 'value'

// Delete a key
await redis.del('key');

// Check if a key exists
const exists = await redis.exists('key');
console.log(exists); // Output: 0 (false)
```


# 2. Hashes (Key-value pairs within a key)
Use Case: Store objects or metadata.

## 2.1.  Add/Update a Single Field - To store or update a single key-value pair (field-value) in a hash:
``` bash
const groupId = 456;  // Group ID
const userId = 123;   // User ID
const randomId = 'abc123'; // Randomized identifier for the user

// Construct the key
const groupKey = `group:${groupId}`;

// Add fields to a hash
await redis.hSet(groupKey, userId, randomId);

// Get all fields and values
const groupMembers = await redis.hGetAll(groupKey);
console.log(groupMembers); // Output: { '123': 'abc123', '124':'xyz789' }

// Get a specific field
const randomId = await redis.hGet(groupKey, userId);
console.log(randomId); // Output: 'abc123'

// Check if a field exists
const fieldExists = await redis.hExists(groupKey, userId);
console.log(fieldExists); // Output: 1 (true) if exists, 0 (false) otherwise

// Delete a field
await redis.hDel(groupKey, userId);

// Delete a key entirely
await redis.del(groupKey);
```
## 2.2. Store Complex Data  - To store multiple properties (like randomId and name), serialize them as a JSON string:
```bash
const groupKey = `group:${groupId}`; 

// Serialize randomId and name into a JSON object
const userData = JSON.stringify({ randomId, name });
await UserManagerRedisClient.hSet(groupKey, userId, userData);

// Get a specific field
const userData = await UserManagerRedisClient.hGet(groupKey, userId);
const user = JSON.parse(userData);
console.log(user.randomId); // Output: "abc123"
console.log(user.name);     // Output: "Alice"

// Rest all operations remains similar
```

# 3. Lists (Ordered collections, like arrays)
Use Case: Queues or stacks

``` bash
// Add elements to a list (left side)
await redis.lpush('tasks', 'Task1', 'Task2');

// Get all elements
const tasks = await redis.lrange('tasks', 0, -1);
console.log(tasks); // Output: ['Task2', 'Task1']

// Remove the first element
const task = await redis.lpop('tasks');
console.log(task); // Output: 'Task2'

// Check if the list exists
const listExists = await redis.exists('tasks');
console.log(listExists); // Output: 1 (true)
```


# 4. Sets (Unordered collections of unique elements)
Use Case: Tags, unique items, or group memberships.

``` bash
const userId = 123;  // The ID of the user
const groupId1 = 456; // The ID of the group to add
const groupId1 = 487; // The ID of the group to add

const userGroupsKey = user:${userId}:groups;

// Add elements to a set
await redis.sAdd(userGroupsKey, groupId1);  // user:123:groups -> {456}
await redis.sAdd(userGroupsKey, groupId2);  // user:123:groups -> {456, 487}

// Check if an element exists
const exists = await redis.sIsMember(userGroupsKey, groupId1);
console.log(exists); // Output: 1 (true)

// Get all members
const allGroups = await redis.sMembers(userGroupsKey);
console.log(allGroups); // Output: ['456', '487'] (order may vary)

// Remove an element
await redis.srem(userGroupsKey, groupId1);
```


# 5. Sorted Sets (Like sets but with scores for sorting)
Use Case: Leaderboards, rankings.

``` bash
// Add elements with scores
await redis.zadd('leaderboard', 100, 'Alice', 200, 'Bob');

// Get elements by rank
const leaders = await redis.zrange('leaderboard', 0, -1);
console.log(leaders); // Output: ['Alice', 'Bob']

// Get score of an element
const score = await redis.zscore('leaderboard', 'Alice');
console.log(score); // Output: 100

// Remove an element
await redis.zrem('leaderboard', 'Alice');
```