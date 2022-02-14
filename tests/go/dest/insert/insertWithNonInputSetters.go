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

func (mrTable *TableTypePost) InsertT(mrQueryable mingru.Queryable, title string, userID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `user_id`, `content`) VALUES (?, ?, \"haha\")", title, userID)
	return err
}
