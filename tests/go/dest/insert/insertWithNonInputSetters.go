package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertT(mrQueryable mingru.Queryable, title string, userID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `user_id`, `content`) VALUES (?, ?, \"haha\")", title, userID)
	return err
}
