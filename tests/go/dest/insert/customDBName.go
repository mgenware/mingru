package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) InsertT(mrQueryable mingru.Queryable, title string, cmtCount uint) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `cmt_c`) VALUES (?, ?)", title, cmtCount)
	return err
}
