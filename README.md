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

# Usage

## Defining Models and Actions

mingru convert [dd-models](https://github.com/mgenware/dd-models) to Go code, please refer to [dd-models docs](https://github.com/mgenware/dd-models) for how to define models and actions.

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

## Converting to Go

Use `mingru.build` along with imported table actions and a dialect to build Go code:

```ts
function build(
  // An array of table actions
  tableActionList: dd.TableActionCollection[],
  // A dialect object, currently, only MySQL is supported
  dialect: Dialect,
  // The out directory where Go files are written to
  outDir: string,
  // Extra options
  options?: IBuildOption,
): Promise<void>;
```

For example, let's say you have a simple user model (`user.ts`):

```ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(200);
  sig = dd.text().nullable;
}

export default dd.table(User);
```

And a set of table actions (`userTA.ts`):

```ts
import * as dd from 'dd-models';
import user from './user';

const userTA = dd.actions(user);
// Select a user profile by ID
userTA.select('UserProfile', user.id, user.name).byID();
// Select all user profiles
userTA.selectAll('AllUserProfiles', user.id, user.name);
// Select a single field by ID
userTA.selectField('Sig', user.sig).byID();

// Update user profile
userTA
  .updateOne('UserProfile')
  .setInputs(user.name, user.sig)
  .byID();

// Delete a row by ID
userTA.deleteOne('ByID').byID();

export default userTA;
```

You import the table action file (`userTA.ts`), create a dialect (`mingru.MySQL()`), and pass them to `mingru.build`:
```ts
import * as mr from 'mingru';
import userTA from './models/userTA';

(async () => {
  await mr.build([userTA], new mr.MySQL(), './build/');
})();
```

After build completes, `User.go` is created in `build` directory.

<details>
 <summary>Full code</summary>

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

// SelectUserProfileResult ...
type SelectUserProfileResult struct {
	UserID   uint64
	UserName string
}

// SelectUserProfile ...
func (da *TableTypeUser) SelectUserProfile(queryable sqlx.Queryable, userID uint64) (*SelectUserProfileResult, error) {
	result := &SelectUserProfileResult{}
	err := queryable.QueryRow("SELECT `id`, `name` FROM `user` WHERE `id` = ?", userID).Scan(&result.UserID, &result.UserName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectAllUserProfilesResult ...
type SelectAllUserProfilesResult struct {
	UserID   uint64
	UserName string
}

// SelectAllUserProfiles ...
func (da *TableTypeUser) SelectAllUserProfiles(queryable sqlx.Queryable) ([]*SelectAllUserProfilesResult, error) {
	rows, err := queryable.Query("SELECT `id`, `name` FROM `user`")
	if err != nil {
		return nil, err
	}
	result := make([]*SelectAllUserProfilesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &SelectAllUserProfilesResult{}
		err = rows.Scan(&item.UserID, &item.UserName)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectSig ...
func (da *TableTypeUser) SelectSig(queryable sqlx.Queryable, userID uint64) (*string, error) {
	var result *string
	err := queryable.QueryRow("SELECT `sig` FROM `user` WHERE `id` = ?", userID).Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateUserProfile ...
func (da *TableTypeUser) UpdateUserProfile(queryable sqlx.Queryable, userID uint64, userName string, userSig *string) error {
	result, err := queryable.Exec("UPDATE `user` SET `name` = ?, `sig` = ? WHERE `id` = ?", userName, userSig, userID)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable sqlx.Queryable, userID uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", userID)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
```

</details>

## FAQ

### Why rely on Node.js/TypeScript? why not use Go to generate Go code?

Great question, the problem of Go is, it cannot offer a way to declare models in a strongly typed way, for example, this is how a model typically looks like in a Go-based library:

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

It uses Go struct field tags to inject model info, thus tends to be error-prone. Below is the code for defining models in mingru using TypeScript, everything is strongly typed:

```ts
// User.ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  display_name = dd.varChar(200);
  url_name = dd.varChar(200);
  sig = dd.text().nullable;
}

export default dd.table(User);
```
