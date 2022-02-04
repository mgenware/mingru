package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// InsertT ...
func (mrTable *TableTypePost) InsertT(mrQueryable mingru.Queryable, title string, cmtCount uint) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `cmt_c`) VALUES (?, ?)", title, cmtCount)
	return err
}
