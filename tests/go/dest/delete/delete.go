import "github.com/mgenware/go-packagex/database/sqlx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable sqlx.Queryable) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post`")
	return sqlx.GetRowsAffectedIntWithError(result, err)
}
