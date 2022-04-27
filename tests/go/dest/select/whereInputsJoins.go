package da

import "github.com/mgenware/mingru-go-lib"

type CmtAGType struct {
}

var Cmt = &CmtAGType{}

// ------------ Actions ------------

type PostCmtTableSelectTResult struct {
	ID uint64
}

func (mrTable *CmtAGType) SelectT(mrQueryable mingru.Queryable, id uint64, userID uint64, targetTitle string, targetUserUrlName string) (PostCmtTableSelectTResult, error) {
	var result PostCmtTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id` FROM `post_cmt` WHERE  ?, ?, ?, ?", id, userID, targetTitle, targetUserUrlName).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
