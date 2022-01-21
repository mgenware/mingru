package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// InsertT ...
func (da *TableTypePost) InsertT(queryable mingru.Queryable, title string, cmtCount uint) error {
	_, err := queryable.Exec("INSERT INTO `db_post` (`title`, `cmt_c`) VALUES (?, ?)", title, cmtCount)
	return err
}
