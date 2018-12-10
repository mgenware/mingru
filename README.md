# mingru (WIP)

[![MEAN Module](https://img.shields.io/badge/MEAN%20Module-TypeScript-blue.svg?style=flat-square)](https://github.com/mgenware/MEAN-Module)
[![Build Status](https://img.shields.io/travis/mgenware/mingru.svg?style=flat-square&label=Build+Status)](https://travis-ci.org/mgenware/mingru)
[![npm version](https://img.shields.io/npm/v/mingru.svg?style=flat-square)](https://npmjs.com/package/mingru)
[![Node.js Version](http://img.shields.io/node/v/mingru.svg?style=flat-square)](https://nodejs.org/en/)

Convert [dd-models](https://github.com/mgenware/dd-models) to Go code.

Goals:

* Provides a data access layer **without extra performance penalty at runtime**
* Everything is **strongly typed**
* The project currently focuses on Go and MySQL/MariaDB

To achieve the these goals, mingru is built as a SQL builder and uses TypeScript to define and convert database models, see [FAQ](#faq) below for more details.

## Hello World

1. Declaring database models, e.g. a simple user table, with ID, display name, URL name and signature.

```ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  display_name = dd.varChar(200).notNull;
  url_name = dd.varChar(200).notNull;
  sig = dd.text();
}

export default dd.table(User);
```

2. Adding actions:

```ts
import * as dd from 'dd-models';
// Import the user model
import user from './models/user';

// TA stands for table actions
const userTA = dd.actions(user);
// Select a single row by ID
userTA
  .select('Profile', user.display_name, user.sig)
  .where(user.id.toInputSQL());
// Update a row
userTA
  .update('Profile')
  .setInputs(user.display_name, user.sig)
  .where(user.id.toInputSQL());
// Delete a row by ID
userTA.deleteOne('ByID').byID();

export [userTA];
```

3. Converting actions to Go code:

```go
package da

import (
	"github.com/mgenware/go-packagex/database/sqlx"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// SelectProfileResult ...
type SelectProfileResult struct {
	UserDisplayName string
	UserSig         *string
}

// SelectProfile ...
func (da *TableTypeUser) SelectProfile(queryable sqlx.Queryable, userID uint64) (*SelectProfileResult, error) {
	result := &SelectProfileResult{}
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user` WHERE ?", userID).Scan(&result.UserDisplayName, &result.UserSig)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateProfile ...
func (da *TableTypeUser) UpdateProfile(queryable sqlx.Queryable, userDisplayName string, userSig *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `display_name` = ?, `sig` = ? WHERE ?", userDisplayName, userSig)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable sqlx.Queryable, userID uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", userID)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
```

## FAQ

### Why rely on Node.js/TypeScript? why not use Go to generate Go code?

Great question, I've thought about it from the very beginning, the problem of Go is that, it cannot offer a way to declare models in a strongly typed way, for example, this is how a model looks like in a Go-based library:

```go
type User struct {
  lib.Model           `table:"users"`
  ID        int64     `pk:"autoincr"`
  Username  string
  Email     string
  Password  string
  CreatedAt time.Time
}
```

It uses Go struct field tags to inject model info. Belows are models of mingru in TypeScript:

```ts
// User.ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  display_name = dd.varChar(200).notNull;
  url_name = dd.varChar(200).notNull;
  sig = dd.text();
}

export default dd.table(User);

// Post.ts
import * as dd from 'dd-models';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  // Foreign key to user.id
  user_id = user.id;
  title = dd.varChar(500).notNull;
  content = dd.text().notNull;
  cmtCount = dd.setName('cmt_c', dd.unsignedInt(0).notNull);
}

export default dd.table(Post);
```
