import "github.com/mgenware/go-packagex/dbx"

// InsertT ...
func (da *TableTypePost) InsertT(queryable dbx.Queryable, title string, userID uint64) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)", title, userID)
	return err
}
