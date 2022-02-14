package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) InsertT(mrQueryable mingru.Queryable, userID *uint64) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `post` (`user_id`) VALUES (?)", userID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
