import "github.com/mgenware/go-packagex/v5/dbx"

// Tx ...
func (da *TableTypePost) Tx(db *sql.DB, id uint64, urlName string, followerCount *string, title string) error {
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = User.Upd(tx, urlName, followerCount, id)
		if err != nil {
			return err
		}
		err = da.Upd(tx, title, id)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

// Upd ...
func (da *TableTypePost) Upd(queryable dbx.Queryable, id uint64, title string) error {
	result, err := queryable.Exec("UPDATE `post` SET `title` = ? WHERE `id` = ?", title, id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
