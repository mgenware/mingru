import "github.com/mgenware/go-packagex/database/sqlx"

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable, postID uint64) (uint64, error) {
	var result uint64
	err := queryable.QueryRow("SELECT `user_id` FROM `post` WHERE `id` = ?", postID).Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
