package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertT ...
func (da *TableTypePost) InsertT(queryable mingru.Queryable, userID *uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`user_id`) VALUES (?)", userID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
