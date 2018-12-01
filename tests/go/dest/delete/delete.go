import "github.com/mgenware/go-packagex/database/sqlx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable sqlx.Queryable) error {
	result, err := queryable.Exec("DELETE FROM `post`")
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
