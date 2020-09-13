package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertT ...
func (da *TableTypePost) InsertT(queryable mingru.Queryable, title string, userID uint64) error {
	_, err := queryable.Exec("INSERT INTO `db_post` (`title`, `user_id`) VALUES (?, ?)", title, userID)
	return err
}
