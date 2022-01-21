package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "post"
}

// ------------ Actions ------------

// InsertT ...
func (mrTable *TableTypePost) InsertT(queryable mingru.Queryable) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`user_id`) VALUES (NULL)")
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
