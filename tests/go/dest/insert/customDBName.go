package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertT(mrQueryable mingru.Queryable, title string, cmtCount uint) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `cmt_c`) VALUES (?, ?)", title, cmtCount)
	return err
}
