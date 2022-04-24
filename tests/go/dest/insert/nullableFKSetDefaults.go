package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertT(mrQueryable mingru.Queryable) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `post` (`user_id`) VALUES (NULL)")
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
