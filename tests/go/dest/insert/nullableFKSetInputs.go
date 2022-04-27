package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertT(mrQueryable mingru.Queryable, userID *uint64) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `post` (`user_id`) VALUES (?)", userID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
