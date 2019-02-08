import "github.com/mgenware/go-packagex/dbx"

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, id uint64) (uint64, error) {
	var result uint64
	err := queryable.QueryRow("SELECT `user_id` FROM `post` WHERE `id` = ?", id).Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
