package da

import "github.com/mgenware/go-packagex/v5/dbx"

// Tx ...
  func (da *TableTypePost) Tx(queryable dbx.Queryable, id uint64, urlName string, followerCount *string, title string) error {
  txErr := dbx.Transact(queryable, func(queryable dbx.Queryable) error {
    var err error
    err = User.Upd(queryable, urlName, followerCount, id)
    if err != nil {
            return err;
    }
    err = da.Upd(queryable, title, id)
    if err != nil {
            return err;
    }
  }
} 

// Upd ...
func (da *TableTypePost) Upd(queryable dbx.Queryable, id uint64, title string) error {
  result, err := queryable.Exec("UPDATE `post` SET `title` = ? WHERE `id` = ?", title, id)
  return dbx.CheckOneRowAffectedWithError(result, err)
}
