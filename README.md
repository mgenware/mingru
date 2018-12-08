# mingru (WIP)

[![MEAN Module](https://img.shields.io/badge/MEAN%20Module-TypeScript-blue.svg?style=flat-square)](https://github.com/mgenware/MEAN-Module)
[![Build Status](https://img.shields.io/travis/mgenware/mingru.svg?style=flat-square&label=Build+Status)](https://travis-ci.org/mgenware/mingru)
[![npm version](https://img.shields.io/npm/v/mingru.svg?style=flat-square)](https://npmjs.com/package/mingru)
[![Node.js Version](http://img.shields.io/node/v/mingru.svg?style=flat-square)](https://nodejs.org/en/)

Convert [dd-models](https://github.com/mgenware/dd-models) to Go code.

Goals:
* No performance penalty: mingru is an SQL builder, not ORM.
* Strongly typed: uses TypeScript to define models and actions(views).

## Hello World
1. Defining database models, e.g. a simple user table, with ID, display name, URL name and signature.
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
userTA.deleteOne('ByID').where(user.id.isEqualToInput());

export userTA;
```

3. Generate Go code from actions(`User.go`):
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
